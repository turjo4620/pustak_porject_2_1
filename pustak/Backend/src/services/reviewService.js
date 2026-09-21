// services/reviewService.js
// Table: reviews (review_id, user_id, book_id, rating 1-5, comment)
const pool = require('../config/db');

// Upsert — one review per user per book
async function submitReview(userId, bookId, rating, comment) {
  const bookRes = await pool.query('SELECT id FROM books WHERE id = $1', [bookId]);
  if (!bookRes.rows.length) {
    throw { status: 404, message: 'বইটি পাওয়া যায়নি' };
  }

  // Check if user already reviewed this book
  const existing = await pool.query(
    'SELECT review_id FROM reviews WHERE user_id = $1 AND book_id = $2',
    [userId, bookId]
  );

  let res;
  if (existing.rows.length) {
    // Update existing review
    res = await pool.query(
      `UPDATE reviews SET rating = $1, comment = $2
       WHERE user_id = $3 AND book_id = $4
       RETURNING *`,
      [rating, comment || null, userId, bookId]
    );
  } else {
    // Insert new review
    res = await pool.query(
      `INSERT INTO reviews (user_id, book_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, bookId, rating, comment || null]
    );
  }

  return res.rows[0];
}

// All reviews for a book (public)
async function getBookReviews(bookId) {
  const res = await pool.query(
    `SELECT r.review_id, r.rating, r.comment,
            u.name AS reviewer_name
     FROM reviews r
     JOIN users u ON u.user_id = r.user_id
     WHERE r.book_id = $1
     ORDER BY r.review_id DESC`,
    [bookId]
  );
  return res.rows;
}

// The logged-in user's own review for one book (or null)
async function getUserReview(userId, bookId) {
  const res = await pool.query(
    'SELECT * FROM reviews WHERE user_id = $1 AND book_id = $2',
    [userId, bookId]
  );
  return res.rows[0] || null;
}

// All reviews written by a user, with book info
async function getUserReviews(userId) {
  const res = await pool.query(
    `SELECT r.review_id, r.book_id, r.rating, r.comment,
            b.book_name, b.cover_image_url,
            MIN(a.name) AS author
     FROM reviews r
     JOIN books        b   ON b.id          = r.book_id
     LEFT JOIN book_author ba ON ba.book_id  = b.id
     LEFT JOIN authors     a  ON a.author_id = ba.author_id
     WHERE r.user_id = $1
     GROUP BY r.review_id, r.book_id, r.rating, r.comment, b.book_name, b.cover_image_url
     ORDER BY r.review_id DESC`,
    [userId]
  );
  return res.rows;
}

async function deleteReview(userId, reviewId) {
  const res = await pool.query(
    'DELETE FROM reviews WHERE review_id = $1 AND user_id = $2 RETURNING review_id',
    [reviewId, userId]
  );
  if (!res.rows.length) {
    throw { status: 404, message: 'রিভিউটি পাওয়া যায়নি' };
  }
  return { deleted: true };
}

module.exports = { submitReview, getBookReviews, getUserReview, getUserReviews, deleteReview };
