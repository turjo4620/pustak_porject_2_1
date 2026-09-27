// services/paymentService.js
const pool = require('../config/db');

async function createPayment(userId, orderId, data) {
  const {
    method,          // 'card' | 'mfs' | 'cod'
    mobileNo,
    providerName,
    cardLast4,
    cardBrand,
    bankName,
    collectedBy,
  } = data;

  if (!['card', 'mfs', 'cod'].includes(method)) {
    throw { status: 400, message: 'অবৈধ পেমেন্ট পদ্ধতি' };
  }

  const status = method === 'cod' ? 'Pending' : 'Completed';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      'SELECT * FROM orders WHERE order_id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, userId]
    );
    if (!orderRes.rows.length) {
      throw { status: 404, message: 'অর্ডার খুঁজে পাওয়া যায়নি' };
    }
    const order = orderRes.rows[0];

    const paymentResult = await client.query(
      `INSERT INTO payments (order_id, amount, payment_status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [orderId, order.total_amount, status]
    );
    const payment = paymentResult.rows[0];

    if (method === 'mfs') {
      await client.query(
        `INSERT INTO mfs_payments (payment_id, sender_mobile_no, provider_name)
         VALUES ($1, $2, $3)`,
        [payment.payment_id, mobileNo || null, providerName || null]
      );
    } else if (method === 'card') {
      await client.query(
        `INSERT INTO card_payments (payment_id, card_last_4_digits, bank_name, card_brand)
         VALUES ($1, $2, $3, $4)`,
        [payment.payment_id, cardLast4 || null, bankName || null, cardBrand || null]
      );
    } else {
      await client.query(
        `INSERT INTO cash_on_deliveries (payment_id, collected_by, collection_date)
         VALUES ($1, $2, NULL)`,
        [payment.payment_id, collectedBy || null]
      );
    }

    await client.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2',
      [method === 'cod' ? 'Confirmed' : 'Paid', orderId]
    );

    await client.query(
      `DELETE FROM cart_item
       WHERE cart_id = (SELECT cart_id FROM cart WHERE user_id = $1)`,
      [userId]
    );

    await client.query('COMMIT');
    return payment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createPayment };
