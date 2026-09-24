// services/returnService.js
//
// Uses the actual live tables:
//   return  — columns: return_id, order_item_id, reason, return_date, status, approved_at
//   refund  — columns: refund_id, return_id, refund_amount, refund_date, refund_status
//
// Ownership is always verified via order_item → orders.user_id (no user_id on return table).
// Status lifecycle on "return": 'initiated' → 'approved' | 'rejected'

const pool = require('../config/db');

const RETURN_WINDOW_DAYS = 7;

function withinReturnWindow(deliveredAt) {
  if (!deliveredAt) return false;
  const diffMs   = Date.now() - new Date(deliveredAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= RETURN_WINDOW_DAYS;
}

// ── requestReturn ──────────────────────────────────────────────────────────
async function requestReturn(userId, orderItemId, reason, copyId = null) {
  // 1. Verify the item belongs to this user's order and the order is Delivered
  const ownershipRes = await pool.query(
    `SELECT
       oi.order_item_id,
       oi.copy_id,
       oi.price_sold,
       o.order_id,
       o.status      AS order_status,
       d.delivered_at,
       d.status      AS delivery_status
     FROM order_item oi
     JOIN orders      o  ON  o.order_id   = oi.order_id
     LEFT JOIN deliveries d ON d.order_id = o.order_id
     WHERE oi.order_item_id = $1
       AND o.user_id         = $2`,
    [orderItemId, userId]
  );

  if (!ownershipRes.rows.length) {
    throw { status: 404, message: 'অর্ডার আইটেমটি খুঁজে পাওয়া যায়নি' };
  }

  const row = ownershipRes.rows[0];

  if (copyId != null && String(row.copy_id) !== String(copyId)) {
    throw { status: 400, message: 'বইয়ের কপি তথ্য সঠিক নয়' };
  }

  if (row.order_status !== 'Delivered' && row.delivery_status !== 'Delivered') {
    throw {
      status: 400,
      message: 'শুধুমাত্র ডেলিভার্ড অর্ডারের জন্য রিটার্ন রিকোয়েস্ট করা যাবে',
    };
  }

  if (!withinReturnWindow(row.delivered_at)) {
    throw {
      status: 400,
      message: `ডেলিভারির ${RETURN_WINDOW_DAYS} দিনের মধ্যে রিটার্ন রিকোয়েস্ট করতে হবে`,
    };
  }

  // 2. Check for duplicate
  const dupRes = await pool.query(
    'SELECT return_id, status FROM "return" WHERE order_item_id = $1',
    [orderItemId]
  );
  if (dupRes.rows.length) {
    throw {
      status: 409,
      message: 'এই আইটেমের জন্য ইতিমধ্যে একটি রিটার্ন রিকোয়েস্ট করা হয়েছে',
    };
  }

  // 3. Insert
  const insertRes = await pool.query(
    `INSERT INTO "return" (order_item_id, reason, status)
     VALUES ($1, $2, 'initiated')
     RETURNING *`,
    [orderItemId, reason || null]
  );

  return insertRes.rows[0];
}

// ── getReturnsForOrder ─────────────────────────────────────────────────────
async function getReturnsForOrder(userId, orderId) {
  // Verify order belongs to user
  const orderRes = await pool.query(
    'SELECT order_id FROM orders WHERE order_id = $1 AND user_id = $2',
    [orderId, userId]
  );
  if (!orderRes.rows.length) {
    throw { status: 404, message: 'অর্ডার খুঁজে পাওয়া যায়নি' };
  }

  const res = await pool.query(
    `SELECT
       r.return_id,
       r.order_item_id,
       oi.copy_id,
       r.reason,
       r.return_date   AS request_date,
       r.status        AS return_status,
       r.approved_at,
       rf.refund_id,
       rf.refund_amount,
       rf.refund_status,
       rf.refund_date  AS refunded_at
     FROM "return" r
     JOIN order_item oi ON oi.order_item_id = r.order_item_id
     LEFT JOIN refund rf ON rf.return_id = r.return_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return res.rows;
}

// ── getUserReturns ─────────────────────────────────────────────────────────
async function getUserReturns(userId) {
  const res = await pool.query(
    `SELECT
       r.return_id,
       oi.order_item_id,
       oi.copy_id,
       r.reason,
       r.return_date   AS request_date,
       r.status        AS return_status,
       r.approved_at,
       b.book_name,
       b.cover_image_url,
       oi.price_sold,
       oi.price_sold AS line_total,
       o.order_id,
       o.order_number,
       d.delivered_at,
       (d.delivered_at >= NOW() - INTERVAL '7 days') AS return_allowed,
       GREATEST(0, 7 - FLOOR(EXTRACT(EPOCH FROM (NOW() - d.delivered_at)) / 86400))::int
         AS return_days_remaining,
       rf.refund_id,
       rf.refund_amount,
       rf.refund_status,
       rf.refund_date  AS refunded_at
     FROM order_item oi
     JOIN orders       o  ON  o.order_id        = oi.order_id
     LEFT JOIN deliveries d ON d.order_id        = o.order_id
     JOIN book_copy   bc  ON  bc.copy_id         = oi.copy_id
     JOIN books        b  ON  b.id               = bc.book_id
     LEFT JOIN "return" r ON r.order_item_id = oi.order_item_id
     LEFT JOIN refund rf  ON  rf.return_id        = r.return_id
     WHERE o.user_id = $1
       AND (o.status = 'Delivered' OR d.status = 'Delivered')
     ORDER BY d.delivered_at DESC, oi.order_item_id`,
    [userId]
  );

  return res.rows;
}

// ── approveReturn (admin) ──────────────────────────────────────────────────
async function approveReturn(returnId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CALL sp_approve_return($1)', [returnId]);
    const refundRes = await client.query(
      'SELECT * FROM refund WHERE return_id = $1',
      [returnId]
    );

    await client.query('COMMIT');
    return { returnId, refund: refundRes.rows[0] || null };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── rejectReturn (admin) ───────────────────────────────────────────────────
async function rejectReturn(returnId) {
  const res = await pool.query(
    `UPDATE "return"
     SET status = 'rejected'
     WHERE return_id = $1 AND status = 'initiated'
     RETURNING *`,
    [returnId]
  );
  if (!res.rows.length) {
    throw {
      status: 404,
      message: 'রিটার্ন খুঁজে পাওয়া যায়নি বা ইতিমধ্যে প্রসেস করা হয়েছে',
    };
  }
  return res.rows[0];
}

async function getAllReturns(page = 1, limit = 20, filters = {}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (currentPage - 1) * pageSize;
  const conditions = [];
  const values = [];

  if (['initiated', 'approved', 'rejected'].includes(filters.status)) {
    values.push(filters.status);
    conditions.push(`r.status = $${values.length}`);
  }

  if (['Pending', 'Processed', 'Failed'].includes(filters.refundStatus)) {
    values.push(filters.refundStatus);
    conditions.push(`rf.refund_status = $${values.length}`);
  }

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(`(
      o.order_number ILIKE $${values.length}
      OR u.name ILIKE $${values.length}
      OR u.email ILIKE $${values.length}
      OR b.book_name ILIKE $${values.length}
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const fromClause = `
    FROM "return" r
    JOIN order_item oi ON oi.order_item_id = r.order_item_id
    JOIN orders o ON o.order_id = oi.order_id
    JOIN users u ON u.user_id = o.user_id
    JOIN book_copy bc ON bc.copy_id = oi.copy_id
    JOIN books b ON b.id = bc.book_id
    LEFT JOIN refund rf ON rf.return_id = r.return_id
  `;

  const [returnsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT
         r.return_id,
         r.order_item_id,
         r.reason,
         r.return_date AS request_date,
         r.status AS return_status,
         r.approved_at,
         o.order_id,
         o.order_number,
         o.status AS order_status,
         u.name AS user_name,
         u.email AS user_email,
         b.book_name,
         b.cover_image_url,
         oi.price_sold,
         rf.refund_id,
         rf.refund_amount,
         rf.refund_status,
         rf.refund_date AS refunded_at
       ${fromClause}
       ${whereClause}
       ORDER BY r.return_date DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       ${fromClause}
       ${whereClause}`,
      values
    ),
  ]);

  const total = countResult.rows[0].total;
  return {
    returns: returnsResult.rows,
    total,
    page: currentPage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function updateRefundStatus(refundId, status) {
  if (!['Processed', 'Failed'].includes(status)) {
    throw { status: 400, message: 'রিফান্ড স্ট্যাটাস অবশ্যই Processed বা Failed হতে হবে' };
  }

  const result = await pool.query(
    `UPDATE refund
     SET refund_status = $1::varchar,
         refund_date = CASE WHEN $1::varchar = 'Processed' THEN CURRENT_TIMESTAMP ELSE refund_date END
     WHERE refund_id = $2 AND refund_status = 'Pending'
     RETURNING *`,
    [status, refundId]
  );

  if (result.rows.length) return result.rows[0];

  const existing = await pool.query(
    'SELECT refund_id FROM refund WHERE refund_id = $1',
    [refundId]
  );
  if (!existing.rows.length) {
    throw { status: 404, message: 'রিফান্ড খুঁজে পাওয়া যায়নি' };
  }

  throw { status: 409, message: 'রিফান্ডটি ইতিমধ্যে চূড়ান্ত করা হয়েছে' };
}

module.exports = {
  requestReturn,
  getReturnsForOrder,
  getUserReturns,
  getAllReturns,
  approveReturn,
  rejectReturn,
  updateRefundStatus,
};
