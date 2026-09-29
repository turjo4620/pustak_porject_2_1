const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Migrations are normally applied during deployment, but this guard keeps
// delivery history working on existing installations that predate migration 015.
// It is intentionally lazy: starting the API must not fail just because an
// administrator has not yet sent a newsletter.
let deliveryLogSetup;

async function ensureDeliveryLogTable() {
  if (!deliveryLogSetup) {
    deliveryLogSetup = pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_delivery_log (
        delivery_id bigserial PRIMARY KEY,
        user_id bigint REFERENCES users(user_id) ON DELETE SET NULL,
        email varchar(255) NOT NULL,
        subject varchar(255) NOT NULL,
        status varchar(20) NOT NULL CHECK (status IN ('sent', 'failed')),
        error_message text,
        sent_at timestamp,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS newsletter_delivery_log_created_at_idx
        ON newsletter_delivery_log (created_at DESC);
    `).catch((error) => {
      // Allow a later attempt after a transient database failure.
      deliveryLogSetup = null;
      throw error;
    });
  }

  return deliveryLogSetup;
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw { status: 503, message: 'Newsletter email service is not configured' };
  }

  return createTransporter(Number(SMTP_PORT), process.env.SMTP_SECURE === 'true');
}

function createTransporter(port, secure) {
  const host = process.env.SMTP_HOST.trim();
  // Google displays app passwords in groups of four for readability. SMTP
  // expects the sixteen characters without those display spaces.
  const password = host.endsWith('gmail.com')
    ? process.env.SMTP_PASSWORD.replace(/\s/g, '')
    : process.env.SMTP_PASSWORD;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: port === 587 && !secure,
    auth: { user: process.env.SMTP_USER.trim(), pass: password },
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
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

  // SMTP egress is commonly blocked or unreliable on managed hosts. Prefer
  // Resend's HTTPS API when configured, and keep SMTP as a local/dev fallback.
  const useResend = Boolean(process.env.RESEND_API_KEY?.trim());
  let sendMail = sendWithResend;
  if (!useResend) {
    const transporter = await getVerifiedTransporter();
    sendMail = transporter.sendMail.bind(transporter);
  }

  // Do this before sending so a missing migration is reported once in server
  // logs instead of being silently swallowed for every recipient.
  await ensureDeliveryLogTable();

  const footer = cleanCoupon
    ? `\n\nUse coupon code: ${cleanCoupon}`
    : '';
  const text = `${cleanMessage}${footer}`;
  const html = `<div style="white-space:pre-wrap">${escapeHtml(cleanMessage)}${cleanCoupon ? `<br><br><strong>Use coupon code: ${escapeHtml(cleanCoupon)}</strong>` : ''}</div>`;
  const results = { total: recipients.length, sent: 0, failed: 0, failures: [] };

  await mapWithConcurrency(recipients, 5, async (recipient) => {
    try {
      await sendWithRetry(sendMail, {
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

async function getVerifiedTransporter() {
  const transporter = getTransporter();
  try {
    await transporter.verify();
    return transporter;
  } catch (primaryError) {
    const usesStartTls = Number(process.env.SMTP_PORT) === 587 && process.env.SMTP_SECURE !== 'true';
    if (!usesStartTls || !isTransientSmtpError(primaryError)) throw primaryError;

    // Some hosting networks block port 587. Gmail also supports implicit TLS on 465.
    transporter.close();
    const fallback = createTransporter(465, true);
    try {
      await fallback.verify();
      console.warn('SMTP port 587 timed out; using Gmail SSL port 465 instead.');
      return fallback;
    } catch (fallbackError) {
      fallback.close();
      throw new Error(`SMTP connection failed on ports 587 and 465: ${fallbackError.message}`);
    }
  }
}

async function sendWithRetry(sendMail, message, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await sendMail(message);
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransientSmtpError(error)) break;
      await delay(attempt * 500);
    }
  }

  throw lastError;
}

async function sendWithResend(message) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || message.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.message || body?.name || `Resend API returned ${response.status}`);
      error.responseCode = response.status;
      throw error;
    }

    return body;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Email provider request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function isTransientSmtpError(error) {
  const retryableCodes = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ESOCKET']);
  return retryableCodes.has(error?.code)
    || error?.responseCode === 408
    || error?.responseCode === 429
    || error?.responseCode >= 500;
}

async function logDelivery(recipient, subject, status, errorMessage = null) {
  await ensureDeliveryLogTable();
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
