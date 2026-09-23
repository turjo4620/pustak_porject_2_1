// services/wishlistService.js
const pool = require('../config/db');

async function getOrCreateWishlist(userId) {
  const existing = await pool.query(
    'SELECT * FROM wishlist WHERE user_id = $1',
    [userId]
  );
  if (existing.rows.length) return existing.rows[0];

  const created = await pool.query(
    'INSERT INTO wishlist (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return created.rows[0];
}

async function getWishlistWithItems(userId) {
  const wishlist = await getOrCreateWishlist(userId);

  const items = await pool.query(
    `SELECT wi.wishlist_item_id, wi.book_id, wi.added_at,
            b.book_name, b.cover_image_url,
                 b.price, b.discount_percentage,
                 ROUND(b.price * (1 - b.discount_percentage / 100.0), 2) AS discount_price,
                MIN(a.name) AS author,
                COALESCE(
                  JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
                    'category_id', c.category_id,
                    'category_name', c.category_name
                  )) FILTER (WHERE c.category_id IS NOT NULL),
                  '[]'::jsonb
                ) AS categories
     FROM wishlist_item wi
     JOIN books b ON b.id = wi.book_id
     LEFT JOIN book_author ba ON b.id = ba.book_id
     LEFT JOIN authors a ON ba.author_id = a.author_id
               LEFT JOIN book_category bc ON b.id = bc.book_id
               LEFT JOIN categories c ON bc.category_id = c.category_id
     WHERE wi.wishlist_id = $1
     GROUP BY wi.wishlist_item_id, wi.book_id, wi.added_at,
              b.book_name, b.cover_image_url, b.price, b.discount_percentage
     ORDER BY wi.added_at DESC`,
    [wishlist.wishlist_id]
  );

  return { wishlist, items: items.rows };
}

// Toggle behaviour: adds the book if not present, removes it if already there.
// Returns { action: 'added'|'removed', item? }
async function toggleItem(userId, bookId) {
  const wishlist = await getOrCreateWishlist(userId);

  // Check if the book is already in the wishlist
  const existing = await pool.query(
    'SELECT wishlist_item_id FROM wishlist_item WHERE wishlist_id = $1 AND book_id = $2',
    [wishlist.wishlist_id, bookId]
  );

  if (existing.rows.length) {
    // Already there — remove it
    await pool.query(
      'DELETE FROM wishlist_item WHERE wishlist_item_id = $1',
      [existing.rows[0].wishlist_item_id]
    );
    return { action: 'removed' };
  }

  // Not there — verify the book exists then add it
  const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1', [bookId]);
  if (!bookCheck.rows.length) {
    throw { status: 404, message: 'বই খুঁজে পাওয়া যায়নি' };
  }

  const result = await pool.query(
    `INSERT INTO wishlist_item (wishlist_id, book_id)
     VALUES ($1, $2)
     RETURNING *`,
    [wishlist.wishlist_id, bookId]
  );
  return { action: 'added', item: result.rows[0] };
}

async function removeItem(userId, wishlistItemId) {
  const wishlist = await getOrCreateWishlist(userId);
  await pool.query(
    'DELETE FROM wishlist_item WHERE wishlist_item_id = $1 AND wishlist_id = $2',
    [wishlistItemId, wishlist.wishlist_id]
  );
}

module.exports = { getOrCreateWishlist, getWishlistWithItems, toggleItem, removeItem };
