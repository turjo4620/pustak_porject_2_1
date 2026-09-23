const pool = require('../config/db');

async function subscribeByEmail(email) {
  const result = await pool.query(
    `INSERT INTO customer (user_id, newsletter_opt_in)
     SELECT user_id, TRUE
     FROM users
     WHERE LOWER(email) = LOWER($1) AND role = 'customer'
     ON CONFLICT (user_id)
     DO UPDATE SET newsletter_opt_in = TRUE
     RETURNING user_id`,
    [email.trim()]
  );

  if (!result.rowCount) {
    throw { status: 404, message: 'এই ইমেইলে কোনো গ্রাহক অ্যাকাউন্ট পাওয়া যায়নি' };
  }
}

module.exports = { subscribeByEmail };