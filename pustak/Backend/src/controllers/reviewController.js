// controllers/reviewController.js
const reviewService = require('../services/reviewService');

// POST /api/reviews
async function submitReview(req, res, next) {
  try {
    const { bookId, rating, comment } = req.body;
    if (!bookId)
      return res.status(400).json({ message: 'bookId প্রয়োজন' });
    if (!rating || Number(rating) < 1 || Number(rating) > 5)
      return res.status(400).json({ message: 'রেটিং ১ থেকে ৫ এর মধ্যে হতে হবে' });

    const review = await reviewService.submitReview(
      req.userId, Number(bookId), Number(rating), comment || ''
    );
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
}

// GET /api/reviews/book/:bookId  (public)
async function getBookReviews(req, res, next) {
  try {
    const reviews = await reviewService.getBookReviews(Number(req.params.bookId));
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
}

// GET /api/reviews/book/:bookId/mine  (auth required)
async function getUserReview(req, res, next) {
  try {
    const review = await reviewService.getUserReview(req.userId, Number(req.params.bookId));
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
}

// GET /api/reviews/mine  (auth required)
async function getUserReviews(req, res, next) {
  try {
    const reviews = await reviewService.getUserReviews(req.userId);
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
}

// DELETE /api/reviews/:reviewId  (auth required)
async function deleteReview(req, res, next) {
  try {
    const result = await reviewService.deleteReview(req.userId, Number(req.params.reviewId));
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

module.exports = { submitReview, getBookReviews, getUserReview, getUserReviews, deleteReview };
