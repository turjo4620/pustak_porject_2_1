const pool = require('../config/db');

const getAllPublications = async (searchTerm = '') => {
  let query = `
    SELECT
      publications.publication_id,
      publications.title,
      publications.bio,
      publications.cover_image_url,
      COUNT(books_count.id) AS book_count
    FROM publications
    LEFT JOIN books books_count ON publications.publication_id = books_count.publication_id
  `;

  const params = [];
  if (searchTerm) {
    query += ` WHERE publications.title ILIKE $1`;
    params.push(`%${searchTerm}%`);
  }

  query += ` GROUP BY publications.publication_id ORDER BY publications.title ASC`;

  const result = await pool.query(query, params);
  return result.rows;
};

const getPublicationByTitle = async (title) => {
  const query = `
    SELECT
      p.publication_id,
      p.title,
      p.bio,
      p.cover_image_url,
      COUNT(b.id) AS book_count
    FROM publications p
    LEFT JOIN books b ON p.publication_id = b.publication_id
    WHERE p.title ILIKE $1
    GROUP BY p.publication_id
    LIMIT 1
  `;
  const result = await pool.query(query, [title]);
  return result.rows[0] || null;
};

const getPublicationByID = async (id) => {
  const query = `
    SELECT publication_id, title, bio, cover_image_url
    FROM publications
    WHERE publication_id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const createPublication = async (publicationData, adminId) => {
  const { title, bio, cover_image_url } = publicationData;
  const query = `
    INSERT INTO publications (title, bio, cover_image_url, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $4)
    RETURNING *
  `;
  const result = await pool.query(query, [title, bio || null, cover_image_url || null, adminId]);
  return result.rows[0];
};

const updatePublication = async (id, publicationData, adminId) => {
  const { title, bio, cover_image_url } = publicationData;
  const query = `
    UPDATE publications
    SET title = $1, bio = $2, cover_image_url = $3, updated_by = $4
    WHERE publication_id = $5
    RETURNING *
  `;
  const result = await pool.query(query, [title, bio || null, cover_image_url || null, adminId, id]);
  return result.rows[0];
};

const deletePublication = async (id) => {
  const query = 'DELETE FROM publications WHERE publication_id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  getAllPublications,
  getPublicationByID,
  getPublicationByTitle,
  createPublication,
  updatePublication,
  deletePublication
};
