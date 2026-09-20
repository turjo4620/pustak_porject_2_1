// routes/returnRoutes.js
const express     = require('express');
const router      = express.Router();
const { requireAuth } = require('../middlewares/auth');
const ctrl        = require('../controllers/returnController');

// All return routes require a valid JWT
router.use(requireAuth);

// User routes
router.post('/',                          ctrl.requestReturn);      // submit return request
router.get('/',                           ctrl.getUserReturns);     // list my returns
router.get('/order/:orderId',             ctrl.getReturnsForOrder); // returns for one order

// Admin-only routes (role check is inside the controller)
router.patch('/:returnId/approve',        ctrl.approveReturn);
router.patch('/:returnId/reject',         ctrl.rejectReturn);

module.exports = router;
