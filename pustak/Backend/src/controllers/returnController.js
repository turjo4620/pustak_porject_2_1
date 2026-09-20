// controllers/returnController.js
const returnService = require('../services/returnService');

// POST /api/returns
// Body: { orderItemId, reason }
async function requestReturn(req, res, next) {
  try {
    const { orderItemId, reason } = req.body;
    if (!orderItemId) {
      return res.status(400).json({ message: 'orderItemId প্রয়োজন' });
    }
    const ret = await returnService.requestReturn(
      req.userId,
      Number(orderItemId),
      reason || ''
    );
    res.status(201).json({ success: true, data: ret });
  } catch (err) {
    next(err);
  }
}

// GET /api/returns
// Returns full return history for the logged-in user
async function getUserReturns(req, res, next) {
  try {
    const returns = await returnService.getUserReturns(req.userId);
    res.json({ success: true, data: returns });
  } catch (err) {
    next(err);
  }
}

// GET /api/returns/order/:orderId
// Returns all return rows for a specific order (user must own it)
async function getReturnsForOrder(req, res, next) {
  try {
    const returns = await returnService.getReturnsForOrder(
      req.userId,
      Number(req.params.orderId)
    );
    res.json({ success: true, data: returns });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/returns/:returnId/approve  (admin only)
async function approveReturn(req, res, next) {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'অ্যাডমিন অ্যাক্সেস প্রয়োজন' });
    }
    const result = await returnService.approveReturn(Number(req.params.returnId));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/returns/:returnId/reject  (admin only)
async function rejectReturn(req, res, next) {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'অ্যাডমিন অ্যাক্সেস প্রয়োজন' });
    }
    const ret = await returnService.rejectReturn(Number(req.params.returnId));
    res.json({ success: true, data: ret });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requestReturn,
  getUserReturns,
  getReturnsForOrder,
  approveReturn,
  rejectReturn,
};
