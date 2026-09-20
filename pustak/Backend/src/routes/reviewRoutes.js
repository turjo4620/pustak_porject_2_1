// routes/reviewRoutes.js
const express        = require('express');
const router         = express.Router();
const { requireAuth } = require('../middlewares/auth');
const ctrl           = require('../controllers/reviewController');

// Public — no auth needed
router.get('/book/:bookId', ctrl.getBookReviews);

// Auth required below this line
router.use(requireAuth);

router.post('/',                 ctrl.submitReview);    // POST   /api/reviews
router.get('/mine',              ctrl.getUserReviews);  // GET    /api/reviews/mine
router.get('/book/:bookId/mine', ctrl.getUserReview);   // GET    /api/reviews/book/:bookId/mine
router.delete('/:reviewId',      ctrl.deleteReview);    // DELETE /api/reviews/:reviewId

module.exports = router;
