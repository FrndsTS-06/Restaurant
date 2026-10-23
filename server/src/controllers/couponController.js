const Coupon = require('../models/Coupon');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendSuccess(res, coupons, 'Coupons retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Validate coupon code for an order amount
// @route   POST /api/coupons/validate
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return sendError(res, 'Coupon code is required', 400);

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) return sendError(res, 'Coupon code not found', 404);

    const validation = coupon.isValidForOrder(Number(orderAmount) || 0);
    if (!validation.valid) {
      return sendError(res, validation.message, 400);
    }

    return sendSuccess(res, {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: validation.discountAmount
    }, 'Coupon is valid');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return sendError(res, 'Code, discountValue, and expiryDate are required', 400);
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      expiryDate: new Date(expiryDate),
      usageLimit: Number(usageLimit) || 100
    });

    return sendSuccess(res, coupon, 'Coupon created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return sendError(res, 'Coupon not found', 404);
    return sendSuccess(res, coupon, 'Coupon updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return sendError(res, 'Coupon not found', 404);
    return sendSuccess(res, null, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
