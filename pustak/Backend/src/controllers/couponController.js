const pool = require('../config/db');
const couponService = require('../services/couponService');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC  POST /api/coupons/validate
// Used by CheckoutPage before placing an order.
// Body: { code, orderSubtotal }
// ─────────────────────────────────────────────────────────────────────────────
const validateCoupon = async (req, res) => {
  try {
    const { code, orderSubtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'কুপন কোড দিন' });
    }

    const { coupon, discount_amount } = await couponService.validateCoupon(
      code,
      Number(orderSubtotal) || 0
    );

    return res.status(200).json({
      success: true,
      discount_amount,
      coupon: {
        coupon_id:      coupon.coupon_id,
        code:           coupon.code,
        description:    coupon.description,
        discount_value: coupon.discount_value,
        discount_type:  coupon.discount_type,
      },
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  GET /api/coupons/admin
// Query params: ?search=CODE  ?status=active|inactive|expired
// ─────────────────────────────────────────────────────────────────────────────
const getAllCoupons = async (req, res) => {
  try {
    const { search, status } = req.query;
    const params = [];

    // Base columns — only real columns from the table
    let query = `
      SELECT
        coupon_id       AS id,
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount,
        max_order_amount,
        usage_limit,
        times_used      AS usage_count,
        start_date,
        end_date,
        status
      FROM coupons
      WHERE 1=1
    `;

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (UPPER(code) LIKE UPPER($${params.length})
                   OR description ILIKE $${params.length})`;
    }

    // Map frontend status filter → SQL conditions on the real columns
    if (status && status !== 'all') {
      if (status === 'active') {
        query += ` AND status = 'Active'
                   AND (start_date IS NULL OR start_date <= NOW())
                   AND (end_date   IS NULL OR end_date   >= NOW())
                   AND (usage_limit IS NULL OR times_used < usage_limit)`;
      } else if (status === 'inactive') {
        query += ` AND status = 'Inactive'`;
      } else if (status === 'expired') {
        query += ` AND end_date IS NOT NULL AND end_date < NOW()`;
      }
    }

    query += ` ORDER BY coupon_id DESC`;

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllCoupons error:', err);
    return res.status(500).json({ message: 'Failed to fetch coupons' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  POST /api/coupons/admin  — create a coupon
// ─────────────────────────────────────────────────────────────────────────────
const createCoupon = async (req, res) => {
  try {
    const {
      code, description,
      discount_type, discount_value,
      min_order_amount, max_order_amount,
      usage_limit,
      start_date, end_date,
      status,             // 'Active' | 'Inactive'
    } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ message: 'code and discount_value are required' });
    }

    // Duplicate check
    const dup = await pool.query(
      `SELECT coupon_id FROM coupons WHERE UPPER(code) = UPPER($1)`,
      [code.trim()]
    );
    if (dup.rows.length) {
      return res.status(409).json({
        message: `Coupon code "${code.trim().toUpperCase()}" already exists`,
      });
    }

    const result = await pool.query(
      `INSERT INTO coupons
         (code, description, discount_type, discount_value,
          min_order_amount, max_order_amount,
          usage_limit, times_used,
          start_date, end_date, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $11)
       RETURNING
         coupon_id AS id, code, description,
         discount_type, discount_value,
         min_order_amount, max_order_amount,
         usage_limit, times_used AS usage_count,
         start_date, end_date, status`,
      [
        code.trim().toUpperCase(),
        description         || null,
        discount_type       || 'flat',
        Number(discount_value),
        min_order_amount    ? Number(min_order_amount)  : null,
        max_order_amount    ? Number(max_order_amount)  : null,
        usage_limit         ? Number(usage_limit)       : null,
        start_date          || null,
        end_date            || null,
        status              === 'Inactive' ? 'Inactive' : 'Active',
        req.admin.user_id,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createCoupon error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create coupon' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  PUT /api/coupons/admin/:id  — update a coupon
// ─────────────────────────────────────────────────────────────────────────────
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code, description,
      discount_type, discount_value,
      min_order_amount, max_order_amount,
      usage_limit,
      start_date, end_date,
      status,
    } = req.body;

    // Duplicate code check (excluding this row)
    if (code) {
      const dup = await pool.query(
        `SELECT coupon_id FROM coupons
         WHERE UPPER(code) = UPPER($1) AND coupon_id != $2`,
        [code.trim(), id]
      );
      if (dup.rows.length) {
        return res.status(409).json({
          message: `Coupon code "${code.trim().toUpperCase()}" already exists`,
        });
      }
    }

    const result = await pool.query(
      `UPDATE coupons SET
         code             = COALESCE(NULLIF(UPPER($1), ''), code),
         description      = $2,
         discount_type    = COALESCE(NULLIF($3, ''), discount_type),
         discount_value   = COALESCE($4, discount_value),
         min_order_amount = $5,
         max_order_amount = $6,
         usage_limit      = $7,
         start_date       = $8,
         end_date         = $9,
         status           = COALESCE(NULLIF($10, ''), status),
         updated_by       = $11
       WHERE coupon_id = $12
       RETURNING
         coupon_id AS id, code, description,
         discount_type, discount_value,
         min_order_amount, max_order_amount,
         usage_limit, times_used AS usage_count,
         start_date, end_date, status`,
      [
        code             ? code.trim().toUpperCase() : '',
        description      ?? null,
        discount_type    || '',
        discount_value   ? Number(discount_value)   : null,
        min_order_amount ? Number(min_order_amount) : null,
        max_order_amount ? Number(max_order_amount) : null,
        usage_limit      ? Number(usage_limit)      : null,
        start_date       || null,
        end_date         || null,
        status           || '',
        req.admin.user_id,
        id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateCoupon error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update coupon' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  DELETE /api/coupons/admin/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM coupons WHERE coupon_id = $1 RETURNING coupon_id`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('deleteCoupon error:', err);
    return res.status(500).json({ message: 'Failed to delete coupon' });
  }
};

module.exports = { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon };
