const pool = require('../config/db');

// Helper: computed discount_price expression
const DISCOUNT_PRICE_EXPR = `ROUND(books.price * (1 - books.discount_percentage / 100.0), 2)`;
const DISCOUNT_PRICE_ALIAS = `ROUND(books.price * (1 - books.discount_percentage / 100.0), 2) AS discount_price`;

const getBooks = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        books.id, 
        books.book_name, 
        books.cover_image_url, 
        books.price,
        books.discount_percentage,
        ${DISCOUNT_PRICE_ALIAS},
        authors.name AS author 
      FROM books 
      JOIN book_author ON books.id = book_author.book_id
      JOIN authors ON book_author.author_id = authors.author_id
      ORDER BY books.id ASC 
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM books');
    const totalBooks  = parseInt(countResult.rows[0].count);

    res.status(200).json({
      data: rows,
      total: totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error" });
  }
};

const searchBooks = async (req, res) => {
  try {
    const page          = parseInt(req.query.page)  || 1;
    const limit         = parseInt(req.query.limit) || 20;
    const offset        = (page - 1) * limit;
    const searchTerm    = req.query.q ? req.query.q.trim() : '';
    const searchPattern = `%${searchTerm.split(/\s+/).join('%')}%`;

    const query = `
      SELECT 
        books.id, 
        books.book_name, 
        books.cover_image_url, 
        books.price,
        books.discount_percentage,
        ${DISCOUNT_PRICE_ALIAS},
        authors.name AS author
      FROM books
      JOIN book_author ON books.id = book_author.book_id
      JOIN authors ON book_author.author_id = authors.author_id
      WHERE books.book_name LIKE $1 OR authors.name LIKE $1
      ORDER BY books.id ASC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(query, [searchPattern, limit, offset]);

    const countQuery  = `
      SELECT COUNT(*) 
      FROM books
      JOIN book_author ON books.id = book_author.book_id
      JOIN authors ON book_author.author_id = authors.author_id
      WHERE books.book_name LIKE $1 OR authors.name LIKE $1
    `;
    const countResult = await pool.query(countQuery, [searchPattern]);
    const totalBooks  = parseInt(countResult.rows[0].count);

    res.status(200).json({
      data: rows,
      total: totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error" });
  }
};

const getBooksByAuthor = async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    const page     = parseInt(req.query.page)  || 1;
    const limit    = parseInt(req.query.limit) || 20;
    const offset   = (page - 1) * limit;

    const authorResult = await pool.query(`SELECT name FROM authors WHERE author_id = $1`, [authorId]);
    if (authorResult.rows.length === 0) {
      return res.status(404).json({ error: "Author not found" });
    }
    const authorName = authorResult.rows[0].name;

    const bookQuery = `
      SELECT 
        books.id, 
        books.book_name, 
        books.cover_image_url, 
        books.price,
        books.discount_percentage,
        ${DISCOUNT_PRICE_ALIAS},
        authors.name AS author
      FROM books
      JOIN book_author ON books.id = book_author.book_id
      JOIN authors ON book_author.author_id = authors.author_id
      WHERE authors.author_id = $1
      ORDER BY 
        CASE 
          WHEN books.book_name LIKE '%কালেকশন%' THEN 1
          WHEN books.book_name LIKE '%বক্সসেট%' THEN 1
          WHEN books.book_name LIKE '%প্যাকেজ%' THEN 1
          WHEN books.book_name LIKE '%সমগ্র%' THEN 1
          WHEN books.book_name LIKE '%রচনাবলি%' THEN 1
          WHEN books.book_name LIKE '%টি বই%' THEN 1
          ELSE 0 
        END ASC,
        books.id ASC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(bookQuery, [authorId, limit, offset]);

    const countResult = await pool.query(`SELECT COUNT(*) FROM book_author WHERE author_id = $1`, [authorId]);
    const totalBooks  = parseInt(countResult.rows[0].count);

    res.status(200).json({
      authorName,
      data: rows,
      total: totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error" });
  }
};

const getBooksByPublication = async (req, res) => {
  try {
    const publicationId = parseInt(req.params.id);
    const page          = parseInt(req.query.page)  || 1;
    const limit         = parseInt(req.query.limit) || 20;
    const offset        = (page - 1) * limit;

    const pubResult = await pool.query(`SELECT title FROM publications WHERE publication_id = $1`, [publicationId]);
    if (pubResult.rows.length === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }
    const publicationName = pubResult.rows[0].title;

    const bookQuery = `
      SELECT
        books.id,
        books.book_name,
        books.cover_image_url,
        books.price,
        books.discount_percentage,
        ${DISCOUNT_PRICE_ALIAS},
        MIN(authors.name) AS author
      FROM books
      LEFT JOIN book_author ON books.id = book_author.book_id
      LEFT JOIN authors ON book_author.author_id = authors.author_id
      WHERE books.publication_id = $1
      GROUP BY books.id
      ORDER BY 
        CASE 
          WHEN books.book_name LIKE '%কালেকশন%' THEN 1
          WHEN books.book_name LIKE '%বক্সসেট%' THEN 1
          WHEN books.book_name LIKE '%প্যাকেজ%' THEN 1
          WHEN books.book_name LIKE '%সমগ্র%' THEN 1
          WHEN books.book_name LIKE '%রচনাবলি%' THEN 1
          WHEN books.book_name LIKE '%টি বই%' THEN 1
          ELSE 0 
        END ASC,
        books.id ASC
      LIMIT $2 OFFSET $3
    `;
    const { rows }    = await pool.query(bookQuery, [publicationId, limit, offset]);
    const countResult = await pool.query(`SELECT COUNT(*) FROM books WHERE publication_id = $1`, [publicationId]);
    const totalBooks  = parseInt(countResult.rows[0].count);

    res.status(200).json({
      publicationName,
      data: rows,
      total: totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error" });
  }
};

const getBooksByCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const page       = parseInt(req.query.page)  || 1;
    const limit      = parseInt(req.query.limit) || 20;
    const offset     = (page - 1) * limit;

    const catResult = await pool.query(`SELECT category_name FROM categories WHERE category_id = $1`, [categoryId]);
    if (catResult.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    const categoryName = catResult.rows[0].category_name;

    const bookQuery = `
      SELECT
        books.id,
        books.book_name,
        books.cover_image_url,
        books.price,
        books.discount_percentage,
        ${DISCOUNT_PRICE_ALIAS},
        MIN(authors.name) AS author
      FROM books
      JOIN book_category ON books.id = book_category.book_id
      LEFT JOIN book_author ON books.id = book_author.book_id
      LEFT JOIN authors ON book_author.author_id = authors.author_id
      WHERE book_category.category_id = $1
      GROUP BY books.id
      ORDER BY books.id ASC
      LIMIT $2 OFFSET $3
    `;
    const { rows }    = await pool.query(bookQuery, [categoryId, limit, offset]);
    const countResult = await pool.query(`SELECT COUNT(*) FROM book_category WHERE category_id = $1`, [categoryId]);
    const totalBooks  = parseInt(countResult.rows[0].count);

    res.status(200).json({
      categoryName,
      data: rows,
      total: totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error fetching books by category" });
  }
};

const getBookById = async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);

    const bookQuery = `
      SELECT 
        books.id, 
        books.book_name, 
        books.cover_image_url, 
        books.price,
        books.discount_percentage,
        ${DISCOUNT_PRICE_ALIAS},
        books.isbn,
        books.language,
        books.num_pages,
        books.edition,
        books.rating,
        books.num_reviews,
        books.availability,
        books.description
      FROM books
      WHERE books.id = $1
    `;
    const bookResult = await pool.query(bookQuery, [bookId]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    const book = bookResult.rows[0];

    const authorsResult = await pool.query(`
      SELECT authors.author_id, authors.name, authors.photo_url
      FROM authors
      JOIN book_author ON authors.author_id = book_author.author_id
      WHERE book_author.book_id = $1
    `, [bookId]);

    const publicationsResult = await pool.query(`
      SELECT publications.publication_id, publications.title, publications.cover_image_url
      FROM publications
      WHERE publications.publication_id = (SELECT publication_id FROM books WHERE id = $1)
    `, [bookId]);

    const categoriesResult = await pool.query(`
      SELECT categories.category_id, categories.category_name
      FROM categories
      JOIN book_category ON categories.category_id = book_category.category_id
      WHERE book_category.book_id = $1
    `, [bookId]);

    res.status(200).json({
      ...book,
      authors:      authorsResult.rows,
      author:       authorsResult.rows[0]?.name || null,
      author_id:    authorsResult.rows[0]?.author_id || null,
      publications: publicationsResult.rows,
      categories:   categoriesResult.rows
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error fetching book" });
  }
};

const getBestsellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const query = `
      SELECT 
        b.id, 
        b.book_name, 
        b.cover_image_url, 
        b.price,
        b.discount_percentage,
        ROUND(b.price * (1 - b.discount_percentage / 100.0), 2) AS discount_price,
        MIN(a.name) AS author,
        COUNT(oi.order_item_id) AS sales_count
      FROM books b
      LEFT JOIN book_copy bc ON b.id = bc.book_id
      LEFT JOIN order_item oi ON bc.copy_id = oi.copy_id
      LEFT JOIN book_author ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.author_id
      GROUP BY b.id, b.book_name, b.cover_image_url, b.price, b.discount_percentage
      ORDER BY sales_count DESC, b.id ASC
      LIMIT $1
    `;
    const { rows } = await pool.query(query, [limit]);

    res.status(200).json({ data: rows, total: rows.length });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error fetching bestsellers" });
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // edition column may contain Bengali digits (২০২৫) or ASCII (2025).
    // Translate Bengali digits → ASCII, then extract 4-digit year.
    const query = `
      WITH translated AS (
        SELECT
          b.*,
          TRANSLATE(
            b.edition,
            '০১২৩৪৫৬৭৮৯',
            '0123456789'
          ) AS edition_ascii
        FROM books b
        WHERE b.edition IS NOT NULL
      ),
      with_year AS (
        SELECT
          t.*,
          (regexp_match(t.edition_ascii, '(\\d{4})'))[1]::INTEGER AS pub_year
        FROM translated t
        WHERE t.edition_ascii ~ '\\d{4}'
      )
      SELECT
        w.id,
        w.book_name,
        w.cover_image_url,
        w.price,
        w.discount_percentage,
        ROUND(w.price * (1 - w.discount_percentage / 100.0), 2) AS discount_price,
        w.edition,
        w.availability,
        w.pub_year,
        MIN(a.name) AS author
      FROM with_year w
      LEFT JOIN book_author ba ON w.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.author_id
      WHERE w.pub_year BETWEEN 1900 AND 2030
      GROUP BY w.id, w.book_name, w.cover_image_url, w.price,
               w.discount_percentage, w.edition, w.availability, w.pub_year
      ORDER BY w.pub_year DESC, w.id DESC
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limit]);
    res.status(200).json({ data: rows, total: rows.length });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error fetching new arrivals' });
  }
};

const getOffers = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 60;
    const minPct = parseInt(req.query.min_pct) || 1; // minimum discount %

    const query = `
      SELECT
        b.id,
        b.book_name,
        b.cover_image_url,
        b.price,
        b.discount_percentage,
        ROUND(b.price * (1 - b.discount_percentage / 100.0), 2) AS discount_price,
        b.availability,
        b.rating,
        b.num_reviews,
        MIN(a.name) AS author
      FROM books b
      LEFT JOIN book_author ba ON b.id = ba.book_id
      LEFT JOIN authors a      ON ba.author_id = a.author_id
      WHERE b.discount_percentage >= $2
      GROUP BY b.id
      ORDER BY b.discount_percentage DESC, b.id ASC
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limit, minPct]);
    res.status(200).json({ data: rows, total: rows.length });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error fetching offers' });
  }
};

module.exports = { getBooks, searchBooks, getBooksByAuthor, getBooksByPublication, getBooksByCategory, getBookById, getBestsellers, getNewArrivals, getOffers };
