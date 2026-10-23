const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Helper to recalculate dish rating metrics
const recalculateDishRating = async (menuItemId) => {
  const approvedReviews = await Review.find({ menuItem: menuItemId, isApproved: true });
  if (approvedReviews.length === 0) {
    await MenuItem.findByIdAndUpdate(menuItemId, {
      rating: 4.8,
      reviewsCount: 0
    });
    return;
  }
  const avg = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
  await MenuItem.findByIdAndUpdate(menuItemId, {
    rating: Math.round(avg * 10) / 10,
    reviewsCount: approvedReviews.length
  });
};

// @desc    Get approved reviews for a specific dish (Public)
// @route   GET /api/reviews/dish/:dishId
const getReviewsForDish = async (req, res, next) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.dishId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, reviews, 'Dish reviews retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a review for an eligible completed order dish
// @route   POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { menuItemId, rating, title, comment, orderId } = req.body;
    if (!menuItemId || !rating || !comment) {
      return sendError(res, 'menuItemId, rating, and comment are required', 400);
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return sendError(res, 'Rating must be an integer between 1 and 5', 400);
    }

    // 1. Eligibility Check: Customer must have a completed or delivered order containing the dish
    const orderQuery = {
      $or: [
        { user: req.user.id },
        { 'customer.email': req.user.email?.toLowerCase() }
      ],
      status: { $in: ['completed', 'delivered'] },
      'items.menuItem': menuItemId
    };

    if (orderId) {
      orderQuery._id = orderId;
    }

    const eligibleOrder = await Order.findOne(orderQuery);

    if (!eligibleOrder) {
      return sendError(
        res,
        'Reviews can only be submitted by verified guests with completed dining or delivery orders for this dish.',
        403
      );
    }

    // 2. Prevent duplicate reviews for the same dish & order
    const existingReview = await Review.findOne({
      user: req.user.id,
      menuItem: menuItemId,
      order: eligibleOrder._id
    });

    if (existingReview) {
      return sendError(res, 'You have already submitted a review for this dish from this order.', 400);
    }

    // 3. Create Review
    const review = await Review.create({
      user: req.user.id,
      menuItem: menuItemId,
      order: eligibleOrder._id,
      rating: Number(rating),
      title: title || '',
      comment: comment.trim(),
      isApproved: true,
      status: 'approved',
      isVerifiedPurchase: true
    });

    // 4. Update dish rating
    await recalculateDishRating(menuItemId);
    await review.populate('user', 'name avatar');

    return sendSuccess(res, review, 'Review submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for moderation (Admin)
// @route   GET /api/reviews
const getAllReviews = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') {
      if (status === 'approved') query.isApproved = true;
      else if (status === 'rejected' || status === 'pending') query.status = status;
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name email avatar')
      .populate('menuItem', 'name price image')
      .populate('order', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'All reviews retrieved',
      data: reviews,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate review status (Admin)
// @route   PATCH /api/reviews/:id/status
const updateReviewStatus = async (req, res, next) => {
  try {
    const { isApproved, status } = req.body;
    const approved = isApproved !== undefined ? Boolean(isApproved) : status === 'approved';
    const newStatus = status || (approved ? 'approved' : 'rejected');

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: approved,
        status: newStatus
      },
      { new: true }
    );

    if (!review) return sendError(res, 'Review not found', 404);

    // Recalculate average dish rating
    await recalculateDishRating(review.menuItem);

    return sendSuccess(res, review, `Review marked as ${newStatus}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review (Admin)
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return sendError(res, 'Review not found', 404);

    await recalculateDishRating(review.menuItem);
    return sendSuccess(res, null, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviewsForDish,
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview
};
