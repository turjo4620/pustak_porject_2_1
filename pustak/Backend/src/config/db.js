const { Pool } = require('pg');
require('dotenv').config();

// Safety guard: fail fast if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL is missing!');
  console.error("Make sure require('dotenv').config() is set before DB initialization.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to Neon Database successfully!');
  }
});

module.exports = pool;