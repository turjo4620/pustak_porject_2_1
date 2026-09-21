const pool = require('../config/db');

async function refreshBookRating(client, bookId) {
  const aggregate = await client.query(
    `SELECT
       COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating,
       COUNT(*)::int AS review_count
     FROM reviews
     WHERE book_id = $1 AND COALESCE(is_hidden, FALSE) = FALSE`,
    [bookId]
  );
  const { average_rating, review_count } = aggregate.rows[0];

  await client.query(
    'UPDATE books SET rating = $1, num_reviews = $2 WHERE id = $3',
    [average_rating, review_count, bookId]
  );

  return {
    average_rating: Number(average_rating),
    review_count: Number(review_count),
  };
}

async function submitReview(userId, bookId, rating, comment) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const bookRes = await client.query('SELECT id FROM books WHERE id = $1 FOR UPDATE', [bookId]);
    if (!bookRes.rows.length) {
      throw { status: 404, message: 'বইটি পাওয়া যায়নি' };
    }

    const existing = await client.query(
      'SELECT review_id FROM reviews WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    const result = existing.rows.length
      ? await client.query(
          `UPDATE reviews SET rating = $1, comment = $2
           WHERE user_id = $3 AND book_id = $4
           RETURNING *`,
          [rating, comment || null, userId, bookId]
        )
      : await client.query(
          `INSERT INTO reviews (user_id, book_id, rating, comment)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [userId, bookId, rating, comment || null]
        );

    const aggregate = await refreshBookRating(client, bookId);
    await client.query('COMMIT');

    return { review: result.rows[0], ...aggregate };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getBookReviews(bookId) {
  const res = await pool.query(
    `SELECT r.review_id, r.rating, r.comment,
            u.name AS reviewer_name
     FROM reviews r
     JOIN users u ON u.user_id = r.user_id
     WHERE r.book_id = $1 AND COALESCE(r.is_hidden, FALSE) = FALSE
     ORDER BY r.review_id DESC`,
    [bookId]
  );
  return res.rows;
}

async function getUserReview(userId, bookId) {
  const res = await pool.query(
    'SELECT * FROM reviews WHERE user_id = $1 AND book_id = $2',
    [userId, bookId]
  );
  return res.rows[0] || null;
}

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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT book_id FROM reviews WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );
    if (!existing.rows.length) {
      throw { status: 404, message: 'রিভিউটি পাওয়া যায়নি' };
    }

    const bookId = existing.rows[0].book_id;
    await client.query('SELECT id FROM books WHERE id = $1 FOR UPDATE', [bookId]);
    await client.query(
      'DELETE FROM reviews WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    const aggregate = await refreshBookRating(client, bookId);
    await client.query('COMMIT');

    return { deleted: true, ...aggregate };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { submitReview, getBookReviews, getUserReview, getUserReviews, deleteReview };
