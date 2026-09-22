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

// ─────────────────────────────────────────────────────────────────
// Canonical catalog endpoint used by every customer-facing list page.
// Supports: scopes (bestsellers / new_arrivals / offers / all),
// locked dimensions (author_id / category_id / publisher_id),
// facet filters (author_ids / category_ids / publisher_ids),
// search q, price range, in-stock toggle, safe sorting, pagination,
// facet counts and price bounds.
// ─────────────────────────────────────────────────────────────────
const CATALOG_SORTS = {
  popularity:  'COALESCE(sales.sales_count, 0) DESC, books.id ASC',
  newest:      'pub_year DESC NULLS LAST, books.id DESC',
  price_asc:   'books.price ASC, books.id ASC',
  price_desc:  'books.price DESC, books.id DESC',
  discount:    'books.discount_percentage::numeric DESC, books.id ASC',
  rating:      'books.rating DESC NULLS LAST, books.num_reviews DESC, books.id ASC',
};
const CATALOG_DEFAULT_SORT = {
  bestsellers: 'popularity',
  new_arrivals: 'newest',
  offers: 'discount',
  all: 'popularity',
};
const BN_YEAR_EXPR = `(regexp_match(TRANSLATE(COALESCE(books.edition, ''), '০১২৩৪৫৬৭৮৯', '0123456789'), '(\\d{4})'))[1]::INTEGER`;

const parseIdList = (raw) => String(raw || '')
  .split(',')
  .map((v) => parseInt(v.trim(), 10))
  .filter(Number.isInteger);

function buildCatalogWhere(opts, skipDimension) {
  const conds = [];
  const params = [];
  const push = (sql, ...vals) => {
    let i = params.length;
    conds.push(sql.replace(/\?/g, () => `$${++i}`));
    params.push(...vals);
  };

  if (opts.q) {
    const pattern = `%${opts.q}%`;
    push(
      `(books.book_name ILIKE ? OR EXISTS (
        SELECT 1 FROM book_author ba
        JOIN authors a ON a.author_id = ba.author_id
        WHERE ba.book_id = books.id AND a.name ILIKE ?
      ))`,
      pattern, pattern
    );
  }
  if (opts.authorId) {
    push(`EXISTS (SELECT 1 FROM book_author ba WHERE ba.book_id = books.id AND ba.author_id = ?)`, opts.authorId);
  } else if (opts.authorIds.length && skipDimension !== 'authors') {
    push(`EXISTS (SELECT 1 FROM book_author ba WHERE ba.book_id = books.id AND ba.author_id = ANY(?))`, opts.authorIds);
  }
  if (opts.categoryId) {
    push(`EXISTS (SELECT 1 FROM book_category bc WHERE bc.book_id = books.id AND bc.category_id = ?)`, opts.categoryId);
  } else if (opts.categoryIds.length && skipDimension !== 'categories') {
    push(`EXISTS (SELECT 1 FROM book_category bc WHERE bc.book_id = books.id AND bc.category_id = ANY(?))`, opts.categoryIds);
  }
  if (opts.publisherId) {
    push(`books.publication_id = ?`, opts.publisherId);
  } else if (opts.publisherIds.length && skipDimension !== 'publishers') {
    push(`books.publication_id = ANY(?)`, opts.publisherIds);
  }
  if (opts.scope === 'offers') {
    push(`books.discount_percentage::numeric >= ?`, opts.minPct);
  }
  if (opts.scope === 'new_arrivals') {
    push(`${BN_YEAR_EXPR} BETWEEN 1900 AND 2030`);
  }
  if (opts.inStock) {
    push(`COALESCE(stock.in_stock, 0) > 0`);
  }
  if (skipDimension !== 'price') {
    if (opts.priceMin != null) push(`books.price >= ?`, opts.priceMin);
    if (opts.priceMax != null) push(`books.price <= ?`, opts.priceMax);
  }

  return { conds, params };
}

const getCatalog = async (req, res) => {
  try {
    const scope      = ['bestsellers', 'new_arrivals', 'offers'].includes(req.query.scope) ? req.query.scope : 'all';
    const sort       = CATALOG_SORTS[req.query.sort] ? req.query.sort : CATALOG_DEFAULT_SORT[scope];
    const page       = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit      = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset     = (page - 1) * limit;
    const q          = req.query.q ? req.query.q.trim() : '';
    const authorId   = parseInt(req.query.author_id)   || null;
    const categoryId = parseInt(req.query.category_id) || null;
    const publisherId= parseInt(req.query.publisher_id)|| null;
    const authorIds    = parseIdList(req.query.author_ids);
    const categoryIds  = parseIdList(req.query.category_ids);
    const publisherIds = parseIdList(req.query.publisher_ids);
    const priceMin   = req.query.price_min != null && req.query.price_min !== '' ? Number(req.query.price_min) : null;
    const priceMax   = req.query.price_max != null && req.query.price_max !== '' ? Number(req.query.price_max) : null;
    const inStock    = req.query.in_stock === 'true' || req.query.in_stock === '1';
    const minPct     = parseInt(req.query.min_pct) || 1;

    if ([priceMin, priceMax].some((v) => v != null && !Number.isFinite(v))) {
      return res.status(400).json({ error: 'Invalid price range' });
    }

    const opts = { q, authorId, categoryId, publisherId, authorIds, categoryIds, publisherIds,
                   priceMin, priceMax, inStock, scope, minPct };

    const where = buildCatalogWhere(opts);
    const whereSql = where.conds.length ? `WHERE ${where.conds.join('\n        AND ')}` : '';

    const dataQuery = `
      WITH sales AS (
        SELECT bc.book_id, COUNT(oi.order_item_id)::int AS sales_count
        FROM book_copy bc
        LEFT JOIN order_item oi ON oi.copy_id = bc.copy_id
        GROUP BY bc.book_id
      ),
      stock AS (
        SELECT bc.book_id, COUNT(*) FILTER (WHERE bc.status = 'in_stock')::int AS in_stock
        FROM book_copy bc
        GROUP BY bc.book_id
      )
      SELECT
        books.id,
        books.book_name,
        books.cover_image_url,
        books.price,
        books.discount_percentage,
        ROUND(books.price * (1 - books.discount_percentage / 100.0), 2) AS discount_price,
        books.rating,
        books.num_reviews,
        books.availability,
        books.edition,
        books.publication_id,
        pub.title AS publisher,
        cat_names.category_list AS category,
        ${BN_YEAR_EXPR} AS pub_year,
        COALESCE(sales.sales_count, 0)::int AS sales_count,
        (COALESCE(stock.in_stock, 0) > 0) AS in_stock,
        STRING_AGG(a.name, ', ' ORDER BY a.name) AS author
      FROM books
      LEFT JOIN book_author ba ON ba.book_id = books.id
      LEFT JOIN authors a ON a.author_id = ba.author_id
      LEFT JOIN publications pub ON pub.publication_id = books.publication_id
      LEFT JOIN LATERAL (
        SELECT STRING_AGG(c.category_name, ', ' ORDER BY c.category_name) AS category_list
        FROM book_category bc
        JOIN categories c ON c.category_id = bc.category_id
        WHERE bc.book_id = books.id
      ) cat_names ON TRUE
      LEFT JOIN sales ON sales.book_id = books.id
      LEFT JOIN stock ON stock.book_id = books.id
      ${whereSql}
      GROUP BY books.id, pub.title, cat_names.category_list, sales.sales_count, stock.in_stock
      ORDER BY ${CATALOG_SORTS[sort]}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataParams = [...where.params];

    // Count + facet queries only need the stock CTE when the in-stock filter is active.
    const needsStock = opts.inStock;
    const stockCte = `
      stock AS (
        SELECT bc.book_id, COUNT(*) FILTER (WHERE bc.status = 'in_stock')::int AS in_stock
        FROM book_copy bc
        GROUP BY bc.book_id
      )`;
    const filteredFrom = `
      FROM books
      ${needsStock ? 'LEFT JOIN stock ON stock.book_id = books.id' : ''}
      ${whereSql}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(
        `${needsStock ? `WITH ${stockCte}` : ''}
         SELECT COUNT(DISTINCT books.id)::int AS total
         ${filteredFrom}`,
        where.params
      ),
    ]);

    const total      = countResult.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // ── Facets (each excludes its own dimension so counts stay meaningful) ──
    const runFacet = async (sql, params) => {
      try { return (await pool.query(sql, params)).rows; } catch (e) {
        console.error('facet error:', e.message);
        return [];
      }
    };

    const [categoryFacets, authorFacets, publisherFacets, priceBounds] = await Promise.all([
      categoryId ? Promise.resolve([]) : runFacet(`
        ${needsStock ? `WITH ${stockCte}` : ''}
        SELECT c.category_id AS id, c.category_name AS name, COUNT(DISTINCT books.id)::int AS count
        FROM books
        JOIN book_category bc ON bc.book_id = books.id
        JOIN categories c ON c.category_id = bc.category_id
        ${needsStock ? 'LEFT JOIN stock ON stock.book_id = books.id' : ''}
        ${buildWhereSql(opts, 'categories')}
        GROUP BY c.category_id, c.category_name
        ORDER BY count DESC, c.category_name ASC
        LIMIT 40`,
        buildCatalogWhere(opts, 'categories').params),
      authorId ? Promise.resolve([]) : runFacet(`
        ${needsStock ? `WITH ${stockCte}` : ''}
        SELECT a.author_id AS id, a.name AS name, COUNT(DISTINCT books.id)::int AS count
        FROM books
        JOIN book_author ba ON ba.book_id = books.id
        JOIN authors a ON a.author_id = ba.author_id
        ${needsStock ? 'LEFT JOIN stock ON stock.book_id = books.id' : ''}
        ${buildWhereSql(opts, 'authors')}
        GROUP BY a.author_id, a.name
        ORDER BY count DESC, a.name ASC
        LIMIT 40`,
        buildCatalogWhere(opts, 'authors').params),
      publisherId ? Promise.resolve([]) : runFacet(`
        ${needsStock ? `WITH ${stockCte}` : ''}
        SELECT p.publication_id AS id, p.title AS name, COUNT(DISTINCT books.id)::int AS count
        FROM books
        JOIN publications p ON p.publication_id = books.publication_id
        ${needsStock ? 'LEFT JOIN stock ON stock.book_id = books.id' : ''}
        ${buildWhereSql(opts, 'publishers')}
        GROUP BY p.publication_id, p.title
        ORDER BY count DESC, p.title ASC
        LIMIT 40`,
        buildCatalogWhere(opts, 'publishers').params),
      runFacet(`
        ${needsStock ? `WITH ${stockCte}` : ''}
        SELECT COALESCE(MIN(books.price), 0)::numeric AS min, COALESCE(MAX(books.price), 0)::numeric AS max
        FROM books
        ${needsStock ? 'LEFT JOIN stock ON stock.book_id = books.id' : ''}
        ${buildWhereSql(opts, 'price')}`,
        buildCatalogWhere(opts, 'price').params),
    ]);

    res.status(200).json({
      data: dataResult.rows,
      total,
      currentPage: page,
      totalPages,
      facets: {
        categories: categoryFacets,
        authors: authorFacets,
        publishers: publisherFacets,
      },
      priceRange: {
        min: Math.floor(Number(priceBounds[0]?.min || 0)),
        max: Math.ceil(Number(priceBounds[0]?.max || 2000)),
      },
    });
  } catch (error) {
    console.error('getCatalog error:', error.message);
    res.status(500).json({ error: 'Error fetching catalog' });
  }
};

function buildWhereSql(opts, skipDimension) {
  const { conds } = buildCatalogWhere(opts, skipDimension);
  return conds.length ? `WHERE ${conds.join('\n          AND ')}` : '';
}

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

module.exports = { getBooks, searchBooks, getBooksByAuthor, getBooksByPublication, getBooksByCategory, getBookById, getBestsellers, getNewArrivals, getOffers, getCatalog };
