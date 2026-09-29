const pool = require('../config/db');
const nodemailer = require('nodemailer');

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw { status: 503, message: 'Newsletter email service is not configured' };
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

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

async function sendCampaign({ subject, message, couponCode = null }) {
  const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  const cleanCoupon = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : null;

  if (!cleanSubject || !cleanMessage) {
    throw { status: 400, message: 'subject and message are required' };
  }

  const transporter = getTransporter();
  const recipients = await pool.query(`
    SELECT u.user_id, u.email
    FROM users u
    JOIN customer c ON c.user_id = u.user_id
    WHERE u.role = 'customer'
      AND u.status = 'Active'
      AND c.newsletter_opt_in = TRUE
    ORDER BY u.user_id
  `);

  const footer = cleanCoupon
    ? `\n\nUse coupon code: ${cleanCoupon}`
    : '';
  const text = `${cleanMessage}${footer}`;
  const html = `<div style="white-space:pre-wrap">${escapeHtml(cleanMessage)}${cleanCoupon ? `<br><br><strong>Use coupon code: ${escapeHtml(cleanCoupon)}</strong>` : ''}</div>`;
  const results = { total: recipients.rowCount, sent: 0, failed: 0, failures: [] };

  for (const recipient of recipients.rows) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient.email,
        subject: cleanSubject,
        text,
        html,
      });
      await pool.query(
        `INSERT INTO newsletter_delivery_log
           (user_id, email, subject, status, sent_at)
         VALUES ($1, $2, $3, 'sent', CURRENT_TIMESTAMP)`,
        [recipient.user_id, recipient.email, cleanSubject]
      );
      results.sent += 1;
    } catch (error) {
      const reason = error.message || 'Email delivery failed';
      await pool.query(
        `INSERT INTO newsletter_delivery_log
           (user_id, email, subject, status, error_message)
         VALUES ($1, $2, $3, 'failed', $4)`,
        [recipient.user_id, recipient.email, cleanSubject, reason]
      );
      results.failed += 1;
      results.failures.push({ email: recipient.email, error: reason });
    }
  }

  return results;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character]));
}

module.exports = { subscribeByEmail, sendCampaign };