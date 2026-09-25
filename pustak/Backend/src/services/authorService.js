const pool = require('../config/db');

const normalizeAuthorName = (name) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const getAllAuthors = async (searchTerm = '') => {
    let query = `
        SELECT 
            authors.author_id, 
            authors.name, 
            authors.bio,
            authors.photo_url, 
            COUNT(book_author.book_id) AS count
        FROM authors
        LEFT JOIN book_author ON authors.author_id = book_author.author_id
    `;
    
    const params = [];
    if (searchTerm) {
        query += ` WHERE authors.name ILIKE $1
            OR EXISTS (
                SELECT 1 FROM author_aliases aa
                WHERE aa.author_id = authors.author_id
                  AND aa.alias_name ILIKE $1
            )`;
        params.push(`%${searchTerm}%`);
    }
    
    query += ` GROUP BY authors.author_id ORDER BY count DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
};

const getAuthorByID = async (id) => {
    const authorResult = await pool.query(
        'SELECT * FROM authors WHERE author_id = $1', [id]
    );
    const author = authorResult.rows[0];
    if (!author) return null;

    return { ...author, author_ids: [author.author_id] };
};

const getAuthorByName = async (name) => {
    // Join with book_author so we can return the book count alongside
    const result = await pool.query(
        `SELECT
            a.author_id,
            a.name,
            a.bio,
            a.photo_url,
            COUNT(ba.book_id) AS count
         FROM authors a
         LEFT JOIN book_author ba ON a.author_id = ba.author_id
         WHERE EXISTS (
             SELECT 1 FROM author_aliases aa
             WHERE aa.author_id = a.author_id
               AND aa.alias_name = $1
         )
         GROUP BY a.author_id
         LIMIT 1`,
        [normalizeAuthorName(name)]
    );
    return result.rows[0] || null;
};

const createAuthor = async (authorData) => {
    const { name, bio, photo_url } = authorData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const aliasName = normalizeAuthorName(name);
        const existing = await client.query(
            `SELECT a.*
             FROM authors a
             LEFT JOIN author_aliases aa ON aa.author_id = a.author_id
             WHERE aa.alias_name = $1
                OR LOWER(TRIM(a.name)) = $1
             LIMIT 1`,
            [aliasName]
        );

        if (existing.rows[0]) {
            await client.query(
                'INSERT INTO author_aliases (alias_name, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [aliasName, existing.rows[0].author_id]
            );
            await client.query('COMMIT');
            return existing.rows[0];
        }

        const result = await client.query(
            `INSERT INTO authors (name, bio, photo_url)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name.trim(), bio || null, photo_url || null]
        );
        await client.query(
            'INSERT INTO author_aliases (alias_name, author_id) VALUES ($1, $2)',
            [aliasName, result.rows[0].author_id]
        );
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateAuthor = async (id, authorData) => {
    const { name, bio, photo_url } = authorData;
    const query = `
        UPDATE authors
        SET name = $1, bio = $2, photo_url = $3
        WHERE author_id = $4
        RETURNING *
    `;
    const result = await pool.query(query, [name, bio || null, photo_url || null, id]);
    if (result.rows[0]) {
        await pool.query(
            'INSERT INTO author_aliases (alias_name, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [normalizeAuthorName(name), id]
        );
    }
    return result.rows[0];
};

const deleteAuthor = async (id) => {
    const query = 'DELETE FROM authors WHERE author_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = { 
    getAllAuthors,
    getAuthorByID,
    getAuthorGroupIds: async (id) => {
        const author = await getAuthorByID(id);
        return author ? [author.author_id] : [];
    },
    getAuthorByName,
    createAuthor,
    updateAuthor,
    deleteAuthor
};