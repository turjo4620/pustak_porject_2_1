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
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
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
  const campaign = normalizeCampaign({ subject, message, couponCode });
  const recipients = await getRecipients();
  return deliverCampaign(campaign, recipients);
}

// Coupon creation must not wait for every SMTP delivery.  The recipient list is
// captured before responding, then delivery continues on this server process.
async function queueCampaign({ subject, message, couponCode = null }) {
  const campaign = normalizeCampaign({ subject, message, couponCode });
  const recipients = await getRecipients();

  if (!recipients.length) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
      failures: [],
      message: 'No active newsletter subscribers were found',
    };
  }

  setImmediate(() => {
    deliverCampaign(campaign, recipients).then((result) => {
      console.log(`Newsletter delivery completed: ${result.sent}/${result.total} sent`);
    }).catch((error) => {
      console.error('Queued newsletter delivery failed:', error.message);
    });
  });

  return {
    total: recipients.length,
    sent: 0,
    failed: 0,
    failures: [],
    queued: true,
  };
}

function normalizeCampaign({ subject, message, couponCode = null }) {
  const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  const cleanCoupon = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : null;

  if (!cleanSubject || !cleanMessage) {
    throw { status: 400, message: 'subject and message are required' };
  }

  return { cleanSubject, cleanMessage, cleanCoupon };
}

async function getRecipients() {
  const result = await pool.query(`
    SELECT u.user_id, u.email
    FROM users u
    JOIN customer c ON c.user_id = u.user_id
    WHERE u.role = 'customer'
      AND u.status = 'Active'
      AND c.newsletter_opt_in = TRUE
    ORDER BY u.user_id
  `);

  return result.rows;
}

async function deliverCampaign({ cleanSubject, cleanMessage, cleanCoupon }, recipients) {
  if (!recipients.length) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
      failures: [],
      message: 'No active newsletter subscribers were found',
    };
  }

  const transporter = getTransporter();
  await transporter.verify();

  const footer = cleanCoupon
    ? `\n\nUse coupon code: ${cleanCoupon}`
    : '';
  const text = `${cleanMessage}${footer}`;
  const html = `<div style="white-space:pre-wrap">${escapeHtml(cleanMessage)}${cleanCoupon ? `<br><br><strong>Use coupon code: ${escapeHtml(cleanCoupon)}</strong>` : ''}</div>`;
  const results = { total: recipients.length, sent: 0, failed: 0, failures: [] };

  await mapWithConcurrency(recipients, 5, async (recipient) => {
    try {
      await sendWithRetry(transporter, {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient.email,
        subject: cleanSubject,
        text,
        html,
      });
      results.sent += 1;
      await logDelivery(recipient, cleanSubject, 'sent').catch((logError) => {
        console.error('Could not record newsletter delivery success:', logError.message);
      });
    } catch (error) {
      const reason = error.message || 'Email delivery failed';
      // A logging issue must not abort the remaining recipients.
      await logDelivery(recipient, cleanSubject, 'failed', reason).catch((logError) => {
        console.error('Could not record newsletter delivery failure:', logError.message);
      });
      results.failed += 1;
      results.failures.push({ email: recipient.email, error: reason });
    }
  });

  if (!results.sent && results.failed) {
    results.message = `Newsletter could not be delivered to any subscriber. ${results.failures[0]?.error || 'Email delivery failed'}`;
  }

  return results;
}

async function sendWithRetry(transporter, message, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await transporter.sendMail(message);
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransientSmtpError(error)) break;
      await delay(attempt * 500);
    }
  }

  throw lastError;
}

function isTransientSmtpError(error) {
  const retryableCodes = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ESOCKET']);
  return retryableCodes.has(error?.code) || (error?.responseCode >= 400 && error.responseCode < 500);
}

async function logDelivery(recipient, subject, status, errorMessage = null) {
  await pool.query(
    `INSERT INTO newsletter_delivery_log
       (user_id, email, subject, status, error_message, sent_at)
     VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = 'sent' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
    [recipient.user_id, recipient.email, subject, status, errorMessage]
  );
}

async function mapWithConcurrency(items, concurrency, handler) {
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await handler(item);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

module.exports = { subscribeByEmail, sendCampaign, queueCampaign };
