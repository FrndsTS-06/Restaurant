const express = require('express');
const router = express.Router();
const {
  getAllCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

// Public validation
router.post('/validate', validateCoupon);

// Admin protected endpoints
router.get('/', protect, authorize('admin'), getAllCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteCoupon);

module.exports = router;
