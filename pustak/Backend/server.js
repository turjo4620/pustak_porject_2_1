const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API!' });
});

// Database test route
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT current_database(), now()');
        res.json({
            success: true,
            message: 'Database connection is working!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
});

const authorRoutes = require('./src/routes/authorRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const authRoutes = require('./src/routes/authRoutes');
const publicationRoutes = require('./src/routes/publicationRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');

const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const wishlistRoutes = require("./src/routes/wishlistRoutes");
const couponRoutes = require("./src/routes/couponRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const returnRoutes = require("./src/routes/returnRoutes");
const reviewRoutes = require("./src/routes/reviewRoutes");

// Admin routes
const adminRoutes = require('./src/routes/adminRoutes');

app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/reviews", reviewRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/categories', categoryRoutes);

// ── Public: top customers for landing page (name + order count only, no sensitive data)
app.get('/api/public/top-customers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const result = await pool.query(`
      SELECT
        u.name,
        COUNT(DISTINCT o.order_id) AS total_orders
      FROM users u
      JOIN orders o ON o.user_id = u.user_id
      WHERE o.status NOT IN ('Cancelled')
      GROUP BY u.user_id, u.name
      ORDER BY total_orders DESC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Admin panel API
app.use('/api/admin', adminRoutes);

// ─── Global error handler ───────────────────────────────────────────────────
// Services throw plain objects { status, message } for expected errors.
// This handler converts them into proper HTTP responses so the frontend
// gets a readable JSON error instead of a raw 500 stack trace.
app.use((err, req, res, next) => {
    // Known operational error thrown by a service layer
    if (err && err.status && err.message) {
        return res.status(err.status).json({ message: err.message });
    }
    // Unexpected / programming error – log it, return generic 500
    console.error('[Unhandled Error]', err);
    res.status(500).json({ message: 'সার্ভারে একটি সমস্যা হয়েছে, আবার চেষ্টা করুন' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});