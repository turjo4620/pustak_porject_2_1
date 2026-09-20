// services/returnService.js
//
// Business rules:
//   • A return can only be requested for a DELIVERED order.
//   • The order must have been delivered within the last 7 days
//     (checked via deliveries.delivered_at).
//   • Each order_item_id may have at most one return (UNIQUE constraint
//     in the DB also enforces this).
//   • Only the user who placed the order may request a return.
//   • Admin approval auto-creates a pending refund row for the full
//     price_sold of that item (or × quantity).

const pool = require('../config/db');

const RETURN_WINDOW_DAYS = 7;

// ── helpers ────────────────────────────────────────────────────────────────

function withinReturnWindow(deliveredAt) {
  if (!deliveredAt) return false;
  const diffMs   = Date.now() - new Date(deliveredAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= RETURN_WINDOW_DAYS;
}

// ── requestReturn ──────────────────────────────────────────────────────────
//
// userId       — from req.userId (JWT)
// orderItemId  — the specific order_item row the user wants to return
// reason       — free-text or preset label from the frontend dropdown
//
// Returns the newly inserted returns row.

async function requestReturn(userId, orderItemId, reason) {
  // 1. Verify the order_item exists, belongs to this user's order,
  //    and the parent order is 'Delivered'.
  const ownershipRes = await pool.query(
    `SELECT
       oi.order_item_id,
       oi.copy_id,
       oi.price_sold,
       o.order_id,
       o.status      AS order_status,
       d.delivered_at
     FROM order_item oi
     JOIN orders     o  ON  o.order_id   = oi.order_id
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

  // 2. Check for duplicate — DB UNIQUE constraint will also catch this,
  //    but we give a friendlier error first.
  const dupRes = await pool.query(
    'SELECT return_id, status FROM returns WHERE order_item_id = $1',
    [orderItemId]
  );
  if (dupRes.rows.length) {
    throw {
      status: 409,
      message: 'এই আইটেমের জন্য ইতিমধ্যে একটি রিটার্ন রিকোয়েস্ট করা হয়েছে',
    };
  }

  // 3. Insert the return request.
  const insertRes = await pool.query(
    `INSERT INTO returns (order_item_id, user_id, reason, status)
     VALUES ($1, $2, $3, 'Requested')
     RETURNING *`,
    [orderItemId, userId, reason || null]
  );

  return insertRes.rows[0];
}

// ── getReturnsForOrder ─────────────────────────────────────────────────────
//
// Returns all return rows (with refund info if present) for a given order,
// verified to belong to userId.

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
       r.request_date,
       r.status        AS return_status,
       r.approved_at,
       rf.refund_id,
       rf.amount       AS refund_amount,
       rf.status       AS refund_status,
       rf.refunded_at
     FROM returns r
     JOIN order_item oi ON oi.order_item_id = r.order_item_id
     LEFT JOIN refunds rf ON rf.return_id = r.return_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return res.rows;
}

// ── getUserReturns ─────────────────────────────────────────────────────────
//
// Full return history for a user, enriched with book title for display.

async function getUserReturns(userId) {
  const res = await pool.query(
    `SELECT
       r.return_id,
       r.order_item_id,
       r.reason,
       r.request_date,
       r.status        AS return_status,
       r.approved_at,
       b.book_name,
       b.cover_image_url,
       oi.price_sold,
       o.order_id,
       o.order_number,
       rf.refund_id,
       rf.amount       AS refund_amount,
       rf.status       AS refund_status,
       rf.refunded_at
     FROM returns r
     JOIN order_item  oi  ON  oi.order_item_id = r.order_item_id
     JOIN orders       o  ON  o.order_id        = oi.order_id
     JOIN book_copy   bc  ON  bc.copy_id         = oi.copy_id
     JOIN books        b  ON  b.id               = bc.book_id
     LEFT JOIN refunds rf ON  rf.return_id        = r.return_id
     WHERE r.user_id = $1
     ORDER BY r.request_date DESC`,
    [userId]
  );

  return res.rows;
}

// ── approveReturn (admin) ──────────────────────────────────────────────────
//
// Sets return status → 'Approved', records approved_at, and creates a
// matching refund row (status = 'Pending') for the full price_sold.
// Uses a transaction so both writes succeed or neither does.

async function approveReturn(returnId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch the return + associated item price
    const retRes = await client.query(
      `SELECT r.return_id, r.status, r.order_item_id,
              oi.price_sold, o.order_id,
              p.payment_id
       FROM returns r
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

    if (ret.status !== 'Requested') {
      throw {
        status: 409,
        message: `রিটার্নটি ইতিমধ্যে '${ret.status}' অবস্থায় আছে`,
      };
    }

    // 2. Approve the return
    await client.query(
      `UPDATE returns
       SET status = 'Approved', approved_at = NOW()
       WHERE return_id = $1`,
      [returnId]
    );

    // 3. Check a refund doesn't already exist (idempotency guard)
    const existingRefund = await client.query(
      'SELECT refund_id FROM refunds WHERE return_id = $1',
      [returnId]
    );

    let refundRow = null;
    if (!existingRefund.rows.length) {
      const refundRes = await client.query(
        `INSERT INTO refunds (return_id, payment_id, amount, status)
         VALUES ($1, $2, $3, 'Pending')
         RETURNING *`,
        [returnId, ret.payment_id || null, ret.price_sold]
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
    `UPDATE returns
     SET status = 'Rejected'
     WHERE return_id = $1 AND status = 'Requested'
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
