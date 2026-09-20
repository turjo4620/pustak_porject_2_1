// services/orderService.js
//
// IMPORTANT: your ORDER_ITEM table references a specific BOOK_COPY
// (copy_id), where each BOOK_COPY row is one serialized physical unit.
// So placing an order for 3x the same book means reserving 3 separate
// BOOK_COPY rows and inserting 3 order_item rows (one per unit).
//
// This requires book_copy to actually have 'in_stock' rows for a book
// before it can be ordered — see sql/003_seed_book_copies_optional.sql
// if you need test inventory.

const pool = require('../config/db');
const cartService = require('./cartService');
const couponService = require('./couponService');

function generateOrderNumber() {
  return 'PB' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000);
}

async function placeOrderFromCart(userId, addressId, couponCode = null, deliveryCharge = 0) {
  const { cart, items } = await cartService.getCartWithItems(userId);
  if (!items.length) {
    throw { status: 400, message: 'কার্ট খালি, অর্ডার দেওয়া যাবে না' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Step 1: lock and reserve physical copies for every cart line
    const reservations = [];
    for (const it of items) {
      const copiesRes = await client.query(
        `SELECT copy_id FROM book_copy
         WHERE book_id = $1 AND status = 'in_stock'
         ORDER BY copy_id
         LIMIT $2
         FOR UPDATE SKIP LOCKED`,
        [it.book_id, it.quantity]
      );

      if (copiesRes.rows.length < it.quantity) {
        throw {
          status: 409,
          message: `"${it.book_name}" বইয়ের পর্যাপ্ত স্টক নেই (আছে ${copiesRes.rows.length}, দরকার ${it.quantity})`,
        };
      }

      reservations.push({
        copyIds:      copiesRes.rows.map((r) => r.copy_id),
        pricePerUnit: it.discount_price ?? it.price,
      });
    }

    // Step 2: calculate totals
    const subtotal = items.reduce(
      (sum, it) => sum + Number(it.discount_price ?? it.price) * it.quantity,
      0
    );

    // Step 3: validate coupon if provided
    let couponId       = null;
    let discountAmount = 0;

    if (couponCode) {
      const { coupon, discount_amount } = await couponService.validateCoupon(couponCode, subtotal);
      couponId       = coupon.coupon_id;
      discountAmount = discount_amount;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount) + Number(deliveryCharge);
    const orderNumber = generateOrderNumber();

    // Step 4: create the order
    const orderRes = await client.query(
      `INSERT INTO orders
         (user_id, address_id, order_number, total_amount, coupon_id, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING *`,
      [userId, addressId || null, orderNumber, totalAmount, couponId]
    );
    const order = orderRes.rows[0];

    // Step 4b: create a deliveries row immediately so delivery_charge is stored
    await client.query(
      `INSERT INTO deliveries (order_id, delivery_charge, status)
       VALUES ($1, $2, 'Pending')
       ON CONFLICT DO NOTHING`,
      [order.order_id, Number(deliveryCharge)]
    );

    // Step 5: one order_item per physical copy, mark each copy sold
    for (const r of reservations) {
      for (const copyId of r.copyIds) {
        await client.query(
          `INSERT INTO order_item (order_id, copy_id, price_sold)
           VALUES ($1, $2, $3)`,
          [order.order_id, copyId, r.pricePerUnit]
        );
        await client.query(
          `UPDATE book_copy SET status = 'sold' WHERE copy_id = $1`,
          [copyId]
        );
      }
    }

    // Step 6: increment coupon usage counter (best-effort — ignore if column missing)
    if (couponId) {
      try {
        await couponService.incrementUsage(client, couponId);
      } catch (_) {
        // times_used column may not exist in this DB — non-fatal
      }
    }

    // Step 7: empty the cart — happens AFTER payment is confirmed
    // Cart is cleared by the payment service, not here, so the user
    // can go back to checkout and still see their items if they haven't paid yet.
    // For now we clear it here only if needed by the payment flow.
    // See paymentService for the actual cart clear on payment confirmation.

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrderById(userId, orderId) {
  const orderRes = await pool.query(
    'SELECT * FROM orders WHERE order_id = $1 AND user_id = $2',
    [orderId, userId]
  );
  if (!orderRes.rows.length) {
    throw { status: 404, message: 'অর্ডার খুঁজে পাওয়া যায়নি' };
  }

  const itemsRes = await pool.query(
    `SELECT
       oi.order_item_id,
       oi.price_sold,
       oi.price_sold                            AS unit_price,
       oi.price_sold                            AS line_total,
       1                                        AS quantity,
       b.id                                     AS book_id,
       b.book_name,
       b.cover_image_url,
       MIN(a.name)                              AS author
     FROM order_item oi
     JOIN book_copy   bc ON bc.copy_id  = oi.copy_id
     JOIN books        b ON b.id        = bc.book_id
     LEFT JOIN book_author ba ON ba.book_id   = b.id
     LEFT JOIN authors     a  ON a.author_id  = ba.author_id
     WHERE oi.order_id = $1
     GROUP BY oi.order_item_id, oi.price_sold, b.id, b.book_name, b.cover_image_url
     ORDER BY oi.order_item_id`,
    [orderId]
  );

  // Delivery address
  const addrRes = await pool.query(
    `SELECT street, area, district, division, postal_code
     FROM addresses
     WHERE address_id = (SELECT address_id FROM orders WHERE order_id = $1)`,
    [orderId]
  );

  // Latest payment info (method + provider details)
  const payRes = await pool.query(
    `SELECT
       p.payment_status,
       CASE
         WHEN m.payment_id IS NOT NULL THEN 'mfs'
         WHEN c.payment_id IS NOT NULL THEN 'card'
         WHEN cod.payment_id IS NOT NULL THEN 'cod'
         ELSE NULL
       END AS method,
       m.provider_name,
       m.sender_mobile_no,
       c.card_brand,
       c.card_last_4_digits
     FROM payments p
     LEFT JOIN mfs_payments  m   ON m.payment_id   = p.payment_id
     LEFT JOIN card_payments c   ON c.payment_id   = p.payment_id
     LEFT JOIN cash_on_deliveries cod ON cod.payment_id = p.payment_id
     WHERE p.order_id = $1
     ORDER BY p.payment_id DESC
     LIMIT 1`,
    [orderId]
  );

  return {
    order:   orderRes.rows[0],
    items:   itemsRes.rows,
    address: addrRes.rows[0] || null,
    payment: payRes.rows[0]  || null,
  };
}

async function listOrders(userId) {
  const res = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC',
    [userId]
  );
  const orders = res.rows;

  // Attach a compact item preview (cover + title + qty) for each order
  if (orders.length > 0) {
    const orderIds = orders.map(o => o.order_id);
    const itemsRes = await pool.query(
      `SELECT
         oi.order_id,
         b.id         AS book_id,
         b.book_name,
         b.cover_image_url,
         COUNT(*)::int AS quantity
       FROM order_item oi
       JOIN book_copy bc ON bc.copy_id = oi.copy_id
       JOIN books     b  ON b.id       = bc.book_id
       WHERE oi.order_id = ANY($1::int[])
       GROUP BY oi.order_id, b.id, b.book_name, b.cover_image_url
       ORDER BY oi.order_id, b.book_name`,
      [orderIds]
    );
    // Group by order_id
    const itemMap = {};
    for (const row of itemsRes.rows) {
      if (!itemMap[row.order_id]) itemMap[row.order_id] = [];
      itemMap[row.order_id].push({
        book_id: row.book_id,
        book_name: row.book_name,
        cover_image_url: row.cover_image_url,
        quantity: row.quantity,
      });
    }
    for (const order of orders) {
      order.items = itemMap[order.order_id] || [];
    }
  }

  return orders;
}

async function getTrackingInfo(userId, orderId) {
  const orderRes = await pool.query(
    `SELECT order_id, order_number, status,
            order_date, confirmed_at, packed_at, cancelled_at
     FROM orders WHERE order_id = $1 AND user_id = $2`,
    [orderId, userId]
  );
  if (!orderRes.rows.length) {
    throw { status: 404, message: 'অর্ডার খুঁজে পাওয়া যায়নি' };
  }

  const deliveryRes = await pool.query(
    `SELECT d.delivery_id, d.tracking_no, d.dispatch_date,
            d.est_date, d.delivered_at, d.status,
            d.delivery_charge, c.name AS courier_name
     FROM deliveries d
     LEFT JOIN courier c ON d.courier_id = c.courier_id
     WHERE d.order_id = $1`,
    [orderId]
  );

  return {
    order:    orderRes.rows[0],
    delivery: deliveryRes.rows[0] || null,
  };
}

async function placeBuyNowOrder(userId, bookId, quantity = 1, addressId = null, deliveryCharge = 0, couponCode = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock and reserve the requested number of copies
    const copiesRes = await client.query(
      `SELECT copy_id FROM book_copy
       WHERE book_id = $1 AND status = 'in_stock'
       ORDER BY copy_id
       LIMIT $2
       FOR UPDATE SKIP LOCKED`,
      [bookId, quantity]
    );

    if (copiesRes.rows.length < quantity) {
      throw {
        status: 409,
        message: `পর্যাপ্ত স্টক নেই (আছে ${copiesRes.rows.length}, দরকার ${quantity})`,
      };
    }

    // Get book price
    const bookRes = await client.query(
      `SELECT price, discount_percentage, book_name,
              ROUND(price * (1 - discount_percentage / 100.0), 2) AS discount_price
       FROM books WHERE id = $1`,
      [bookId]
    );
    if (!bookRes.rows.length) {
      throw { status: 404, message: 'বই খুঁজে পাওয়া যায়নি' };
    }
    const book         = bookRes.rows[0];
    const pricePerUnit = book.discount_price ?? book.price;

    // Calculate totals
    const subtotal = Number(pricePerUnit) * quantity;

    let couponId       = null;
    let discountAmount = 0;
    if (couponCode) {
      const { coupon, discount_amount } = await couponService.validateCoupon(couponCode, subtotal);
      couponId       = coupon.coupon_id;
      discountAmount = discount_amount;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount) + Number(deliveryCharge);
    const orderNumber = generateOrderNumber();

    // Create order
    const orderRes = await client.query(
      `INSERT INTO orders
         (user_id, address_id, order_number, total_amount, coupon_id, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING *`,
      [userId, addressId || null, orderNumber, totalAmount, couponId]
    );
    const order = orderRes.rows[0];

    // Create deliveries row immediately so delivery_charge is stored
    await client.query(
      `INSERT INTO deliveries (order_id, delivery_charge, status)
       VALUES ($1, $2, 'Pending')
       ON CONFLICT DO NOTHING`,
      [order.order_id, Number(deliveryCharge)]
    );

    // Insert one order_item per physical copy, mark each sold
    for (const row of copiesRes.rows) {
      await client.query(
        `INSERT INTO order_item (order_id, copy_id, price_sold) VALUES ($1, $2, $3)`,
        [order.order_id, row.copy_id, pricePerUnit]
      );
      await client.query(
        `UPDATE book_copy SET status = 'sold' WHERE copy_id = $1`,
        [row.copy_id]
      );
    }

    // Best-effort coupon usage increment
    if (couponId) {
      try { await couponService.incrementUsage(client, couponId); } catch (_) {}
    }

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { placeOrderFromCart, placeBuyNowOrder, getOrderById, listOrders, getTrackingInfo };
