const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { validateOrderPayload } = require('../validators/orderValidator');
const { trackingLimiter } = require('../middleware/rateLimiter');

// Public or customer order creation (attaches user if authenticated)
router.post('/', optionalProtect, validateOrderPayload, createOrder);

// Customer view their own orders (rate-limited)
router.get('/my-orders', trackingLimiter, optionalProtect, getMyOrders);

// Track / view single order details (rate-limited)
router.get('/:id', trackingLimiter, optionalProtect, getOrderById);

// Customer / staff order cancellation
router.post('/:id/cancel', optionalProtect, cancelOrder);
router.patch('/:id/cancel', optionalProtect, cancelOrder);

// Admin & Staff view all orders & update status
router.get('/', protect, authorize('admin', 'staff'), getAllOrders);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus);

module.exports = router;
