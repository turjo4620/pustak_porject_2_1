// routes/returnRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const ctrl = require('../controllers/returnController');

router.post('/', requireAuth, ctrl.requestReturn);
router.get('/', requireAuth, ctrl.getUserReturns);
router.get('/order/:orderId', requireAuth, ctrl.getReturnsForOrder);

module.exports = router;
