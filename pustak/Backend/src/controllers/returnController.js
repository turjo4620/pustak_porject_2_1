// controllers/returnController.js
const returnService = require('../services/returnService');

// POST /api/returns
// Body: { orderItemId, reason }
async function requestReturn(req, res, next) {
  try {
    const { orderItemId, copyId, reason } = req.body;
    if (!orderItemId) {
      return res.status(400).json({ message: 'orderItemId প্রয়োজন' });
    }
    const ret = await returnService.requestReturn(
      req.userId,
      Number(orderItemId),
      reason || '',
      copyId ? Number(copyId) : null
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

async function getAllReturns(req, res, next) {
  try {
    const result = await returnService.getAllReturns(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
      {
        search: req.query.search,
        status: req.query.status,
        refundStatus: req.query.refundStatus,
      }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function approveReturn(req, res, next) {
  try {
    const result = await returnService.approveReturn(Number(req.params.returnId));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function rejectReturn(req, res, next) {
  try {
    const ret = await returnService.rejectReturn(Number(req.params.returnId));
    res.json({ success: true, data: ret });
  } catch (err) {
    next(err);
  }
}

async function updateRefundStatus(req, res, next) {
  try {
    const refund = await returnService.updateRefundStatus(
      Number(req.params.refundId),
      req.body.status
    );
    res.json({ success: true, data: refund });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requestReturn,
  getUserReturns,
  getReturnsForOrder,
  getAllReturns,
  approveReturn,
  rejectReturn,
  updateRefundStatus,
};
