const pool = require('../config/db');

const mergeAuthorRows = (rows) => {
    const parent = new Map(rows.map((author) => [author.author_id, author.author_id]));
    const identityOwners = new Map();

    const find = (id) => {
        let root = parent.get(id);
        while (root !== parent.get(root)) {
            parent.set(root, parent.get(parent.get(root)));
            root = parent.get(root);
        }
        return root;
    };

    const union = (firstId, secondId) => {
        const firstRoot = find(firstId);
        const secondRoot = find(secondId);
        if (firstRoot !== secondRoot) parent.set(secondRoot, firstRoot);
    };

    rows.forEach((author) => {
        const identities = [
            author.photo_url && `photo:${author.photo_url.trim()}`,
            author.bio && `bio:${author.bio.trim()}`,
        ].filter(Boolean);

        identities.forEach((identity) => {
            const ownerId = identityOwners.get(identity);
            if (ownerId !== undefined) union(author.author_id, ownerId);
            else identityOwners.set(identity, author.author_id);
        });
    });

    const groups = new Map();
    rows.forEach((author) => {
        const root = find(author.author_id);
        const group = groups.get(root);

        if (group) {
            group.author_ids.push(author.author_id);
            group.count += Number(author.count || 0);
            if (Number(author.count || 0) > Number(group._canonicalCount || 0)) {
                group.name = author.name;
                group.bio = author.bio || group.bio;
                group.photo_url = author.photo_url || group.photo_url;
                group._canonicalCount = Number(author.count || 0);
            }
            return;
        }

        groups.set(root, {
            ...author,
            author_ids: [author.author_id],
            count: Number(author.count || 0),
            _canonicalCount: Number(author.count || 0),
        });
    });

    return Array.from(groups.values())
        .map(({ _canonicalCount, ...author }) => author)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

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
        query += ` WHERE authors.name ILIKE $1`;
        params.push(`%${searchTerm}%`);
    }
    
    query += ` GROUP BY authors.author_id ORDER BY count DESC`;
    
    const result = await pool.query(query, params);
    return mergeAuthorRows(result.rows);
};

const getAuthorByID = async (id) => {
    const authorResult = await pool.query(
        'SELECT * FROM authors WHERE author_id = $1', [id]
    );
    const author = authorResult.rows[0];
    if (!author) return null;

    const identityColumn = author.photo_url ? 'photo_url' : author.bio ? 'bio' : null;
    const groupResult = identityColumn
        ? await pool.query(
            `SELECT author_id FROM authors WHERE ${identityColumn} IS NOT DISTINCT FROM $1`,
            [author[identityColumn]]
        )
        : { rows: [author] };
    const groupIds = groupResult.rows.map((row) => row.author_id);
    const canonicalId = Math.min(...groupIds);
    const canonical = groupIds.includes(author.author_id)
        ? (await pool.query('SELECT * FROM authors WHERE author_id = $1', [canonicalId])).rows[0]
        : author;

    return { ...canonical, author_ids: groupIds };
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
         WHERE a.name ILIKE $1
         GROUP BY a.author_id
         LIMIT 1`,
        [name]
    );
    return result.rows[0] || null;
};

const createAuthor = async (authorData) => {
    const { name, bio, photo_url } = authorData;
    const query = `
        INSERT INTO authors (name, bio, photo_url)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const result = await pool.query(query, [name, bio || null, photo_url || null]);
    return result.rows[0];
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
        return author ? author.author_ids : [];
    },
    getAuthorByName,
    createAuthor,
    updateAuthor,
    deleteAuthor
};