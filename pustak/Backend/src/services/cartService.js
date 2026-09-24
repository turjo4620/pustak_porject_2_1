// services/cartService.js
const pool = require('../config/db');
const withTransaction = require('../utils/withTransaction');

async function getOrCreateCart(userId) {
  return withTransaction(async (client) => {
    const existing = await client.query('SELECT * FROM cart WHERE user_id = $1 FOR UPDATE', [userId]);
    if (existing.rows.length) return existing.rows[0];

    const created = await client.query(
      'INSERT INTO cart (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return created.rows[0];
  });
}

// How many un-sold physical copies exist for a book right now.
async function getAvailableStock(bookId) {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM book_copy WHERE book_id = $1 AND status = 'in_stock'`,
    [bookId]
  );
  return res.rows[0].count;
}

async function getCartWithItems(userId) {
  const cart = await getOrCreateCart(userId);
  const items = await pool.query(
    `SELECT ci.cart_item_id, ci.book_id, ci.quantity,
            b.book_name, b.cover_image_url, b.price,
            b.discount_percentage,
            ROUND(b.price * (1 - b.discount_percentage / 100.0), 2) AS discount_price,
            ROUND(b.price * (1 - b.discount_percentage / 100.0), 2) AS locked_price,
            MIN(a.name) AS author,
            MIN(a.name) AS authors
     FROM cart_item ci
     JOIN books b ON b.id = ci.book_id
     LEFT JOIN book_author ba ON b.id = ba.book_id
     LEFT JOIN authors a ON ba.author_id = a.author_id
     WHERE ci.cart_id = $1
     GROUP BY ci.cart_item_id, ci.book_id, ci.quantity,
              b.book_name, b.cover_image_url, b.price, b.discount_percentage
     ORDER BY ci.cart_item_id`,
    [cart.cart_id]
  );
  return { cart, items: items.rows };
}

async function addItem(userId, bookId, quantity = 1) {
  return withTransaction(async (client) => {
    const cartRes = await client.query('SELECT * FROM cart WHERE user_id = $1 FOR UPDATE', [userId]);
    const cart = cartRes.rows[0] || (
      await client.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING *', [userId])
    ).rows[0];

    const bookRes = await client.query(
      `SELECT id, price, discount_percentage,
              ROUND(price * (1 - discount_percentage / 100.0), 2) AS discount_price
       FROM books WHERE id = $1`,
      [bookId]
    );
    if (!bookRes.rows.length) throw { status: 404, message: 'বই খুঁজে পাওয়া যায়নি' };

    const existingRes = await client.query(
      'SELECT quantity FROM cart_item WHERE cart_id = $1 AND book_id = $2 FOR UPDATE',
      [cart.cart_id, bookId]
    );
    const desiredQty = (existingRes.rows[0]?.quantity || 0) + quantity;
    const stockRes = await client.query(
      `SELECT COUNT(*)::int AS count FROM book_copy
       WHERE book_id = $1 AND status = 'in_stock'`,
      [bookId]
    );
    const stock = stockRes.rows[0].count;
    if (desiredQty > stock) {
      throw {
        status: 409,
        message: stock > 0
          ? `দুঃখিত, এই মুহূর্তে মাত্র ${stock}টি কপি স্টকে আছে`
          : 'দুঃখিত, এই বইটি এখন স্টকে নেই',
      };
    }

    const result = await client.query(
      `INSERT INTO cart_item (cart_id, book_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, book_id)
       DO UPDATE SET quantity = cart_item.quantity + EXCLUDED.quantity
       RETURNING *`,
      [cart.cart_id, bookId, quantity]
    );
    await client.query(
      'UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE cart_id = $1',
      [cart.cart_id]
    );
    return result.rows[0];
  });
}

async function setItemQuantity(userId, cartItemId, quantity) {
  return withTransaction(async (client) => {
    const cart = (await client.query('SELECT * FROM cart WHERE user_id = $1 FOR UPDATE', [userId])).rows[0];
    if (!cart) throw { status: 404, message: 'কার্ট খুঁজে পাওয়া যায়নি' };
    if (quantity <= 0) {
      await client.query('DELETE FROM cart_item WHERE cart_item_id = $1 AND cart_id = $2', [cartItemId, cart.cart_id]);
      return null;
    }
    const itemRes = await client.query(
      'SELECT book_id FROM cart_item WHERE cart_item_id = $1 AND cart_id = $2 FOR UPDATE',
      [cartItemId, cart.cart_id]
    );
    if (!itemRes.rows.length) throw { status: 404, message: 'কার্ট আইটেম খুঁজে পাওয়া যায়নি' };
    const stockRes = await client.query(
      `SELECT COUNT(*)::int AS count FROM book_copy
       WHERE book_id = $1 AND status = 'in_stock'`,
      [itemRes.rows[0].book_id]
    );
    if (quantity > stockRes.rows[0].count) {
      throw { status: 409, message: `দুঃখিত, এই মুহূর্তে মাত্র ${stockRes.rows[0].count}টি কপি স্টকে আছে` };
    }
    const result = await client.query(
      `UPDATE cart_item SET quantity = $1
       WHERE cart_item_id = $2 AND cart_id = $3
       RETURNING *`,
      [quantity, cartItemId, cart.cart_id]
    );
    return result.rows[0];
  });
}

async function removeItem(userId, cartItemId) {
  return withTransaction(async (client) => {
    const cart = (await client.query('SELECT * FROM cart WHERE user_id = $1 FOR UPDATE', [userId])).rows[0];
    if (!cart) return;
    await client.query(
      'DELETE FROM cart_item WHERE cart_item_id = $1 AND cart_id = $2',
      [cartItemId, cart.cart_id]
    );
  });
}

async function clearCart(userId) {
  return withTransaction(async (client) => {
    const cart = (await client.query('SELECT * FROM cart WHERE user_id = $1 FOR UPDATE', [userId])).rows[0];
    if (!cart) return;
    await client.query('DELETE FROM cart_item WHERE cart_id = $1', [cart.cart_id]);
  });
}

module.exports = {
  getOrCreateCart,
  getCartWithItems,
  getAvailableStock,
  addItem,
  setItemQuantity,
  removeItem,
  clearCart,
};
