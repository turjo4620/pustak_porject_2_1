// controllers/orderController.js
const orderService = require('../services/orderService');

async function placeOrder(req, res, next) {
  try {
    const { addressId, couponCode, deliveryCharge } = req.body;
    const order = await orderService.placeOrderFromCart(
      req.userId, addressId, couponCode || null, Number(deliveryCharge) || 0
    );
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const data = await orderService.getOrderById(req.userId, req.params.orderId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getOrders(req, res, next) {
  try {
    const orders = await orderService.listOrders(req.userId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function getBuyerRank(req, res, next) {
  try {
    const userId = Number(req.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'অবৈধ ব্যবহারকারী আইডি' });
    }
    const ranking = await orderService.getBuyerRank(userId);
    res.json(ranking || { rank: null, total_buyers: 0, total_orders: 0, total_spent: 0 });
  } catch (err) {
    next(err);
  }
}

async function getTracking(req, res, next) {
  try {
    const data = await orderService.getTrackingInfo(req.userId, req.params.orderId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function buyNow(req, res, next) {
  try {
    const { bookId, quantity, addressId, deliveryCharge, couponCode } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId is required' });
    const order = await orderService.placeBuyNowOrder(
      req.userId,
      bookId,
      parseInt(quantity) || 1,
      addressId || null,
      Number(deliveryCharge) || 0,
      couponCode || null
    );
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await orderService.cancelOrder(req.userId, req.params.orderId);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

module.exports = { placeOrder, buyNow, getOrder, getOrders, getBuyerRank, getTracking, cancelOrder };
