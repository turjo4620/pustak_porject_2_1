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
async function requestReturn(userId, orderItemId, reason) {
  // 1. Verify the item belongs to this user's order and the order is Delivered
  const ownershipRes = await pool.query(
    `SELECT
       oi.order_item_id,
       oi.price_sold,
       o.order_id,
       o.status      AS order_status,
       d.delivered_at
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

  if (row.order_status !== 'Delivered') {
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
       r.order_item_id,
       r.reason,
       r.return_date   AS request_date,
       r.status        AS return_status,
       r.approved_at,
       b.book_name,
       b.cover_image_url,
       oi.price_sold,
       o.order_id,
       o.order_number,
       rf.refund_id,
       rf.refund_amount,
       rf.refund_status,
       rf.refund_date  AS refunded_at
     FROM "return" r
     JOIN order_item  oi  ON  oi.order_item_id = r.order_item_id
     JOIN orders       o  ON  o.order_id        = oi.order_id
     JOIN book_copy   bc  ON  bc.copy_id         = oi.copy_id
     JOIN books        b  ON  b.id               = bc.book_id
     LEFT JOIN refund rf  ON  rf.return_id        = r.return_id
     WHERE o.user_id = $1
     ORDER BY r.return_date DESC`,
    [userId]
  );

  return res.rows;
}

// ── approveReturn (admin) ──────────────────────────────────────────────────
async function approveReturn(returnId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const retRes = await client.query(
      `SELECT r.return_id, r.status, r.order_item_id,
              oi.price_sold, o.order_id,
              p.payment_id
       FROM "return" r
       JOIN order_item oi ON oi.order_item_id = r.order_item_id
       JOIN orders      o  ON o.order_id       = oi.order_id
       LEFT JOIN payments p ON p.order_id      = o.order_id
                            AND p.payment_status = 'Completed'
       WHERE r.return_id = $1
       ORDER BY p.payment_id DESC
       LIMIT 1`,
      [returnId]
    );

    if (!retRes.rows.length) {
      throw { status: 404, message: 'রিটার্ন রিকোয়েস্ট খুঁজে পাওয়া যায়নি' };
    }

    const ret = retRes.rows[0];

    if (ret.status !== 'initiated') {
      throw {
        status: 409,
        message: `রিটার্নটি ইতিমধ্যে '${ret.status}' অবস্থায় আছে`,
      };
    }

    // Approve
    await client.query(
      `UPDATE "return"
       SET status = 'approved', approved_at = NOW()
       WHERE return_id = $1`,
      [returnId]
    );

    // Create refund row (idempotent)
    const existingRefund = await client.query(
      'SELECT refund_id FROM refund WHERE return_id = $1',
      [returnId]
    );

    let refundRow = null;
    if (!existingRefund.rows.length) {
      const refundRes = await client.query(
        `INSERT INTO refund (return_id, refund_amount, refund_status)
         VALUES ($1, $2, 'Pending')
         RETURNING *`,
        [returnId, ret.price_sold]
      );
      refundRow = refundRes.rows[0];
    } else {
      refundRow = existingRefund.rows[0];
    }

    await client.query('COMMIT');
    return { returnId, refund: refundRow };
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

module.exports = {
  requestReturn,
  getReturnsForOrder,
  getUserReturns,
  approveReturn,
  rejectReturn,
};
