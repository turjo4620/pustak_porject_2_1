// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const orderController = require('../controllers/orderController');

router.use(requireAuth);

// POST /api/orders/buy-now      -> body: { bookId, quantity, couponCode? } | direct purchase, bypasses cart
router.post('/buy-now', orderController.buyNow);

// POST /api/orders            -> body: { addressId? } | places order from cart
router.post('/', orderController.placeOrder);

// GET  /api/orders            -> list current user's orders
router.get('/', orderController.getOrders);

// GET  /api/orders/:orderId           -> { order, items } | used by PaymentPage
router.get('/:orderId', orderController.getOrder);

// PATCH /api/orders/:orderId/cancel  -> cancel an order (customer)
router.patch('/:orderId/cancel', orderController.cancelOrder);

// GET  /api/orders/:orderId/tracking  -> { order, delivery } | used by AccountOrders
router.get('/:orderId/tracking', orderController.getTracking);

module.exports = router;
