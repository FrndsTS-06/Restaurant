const express = require('express');
const router = express.Router();
const {
  getReviewsForDish,
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

// Public reviews for a dish
router.get('/dish/:dishId', validateObjectId('dishId'), getReviewsForDish);

// Customer post verified review
router.post('/', protect, createReview);

// Admin review moderation
router.get('/', protect, authorize('admin', 'staff'), getAllReviews);
router.get('/admin', protect, authorize('admin', 'staff'), getAllReviews);
router.patch('/:id/status', protect, authorize('admin'), validateObjectId('id'), updateReviewStatus);
router.put('/:id/status', protect, authorize('admin'), validateObjectId('id'), updateReviewStatus);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteReview);

module.exports = router;
