const { Pool } = require('pg');
<<<<<<< HEAD

// 1. SAFETY GUARD: Catch missing variables immediately
if (!process.env.DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL is missing!");
    console.error("Make sure require('dotenv').config() is on line 1 of server.js.");
    process.exit(1);
}

// 2. Initialize using the Neon connection string and mandatory SSL
=======
require('dotenv').config();

// Initialize using the Neon connection string and mandatory SSL
>>>>>>> 1ec7747 (added)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

<<<<<<< HEAD
// 3. Safely test the connection
=======
// Safely test the connection
>>>>>>> 1ec7747 (added)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to Neon Database successfully!');
  }
});

module.exports = pool;