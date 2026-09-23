// One-time migration: add is_hidden column to reviews if missing
const pool = require('./src/config/db');
(async () => {
  await pool.query(`
    ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE
  `);
  console.log('✓ reviews.is_hidden column ensured');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
