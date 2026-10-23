const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  updateOrderType,
  applyCouponToCart,
  mergeCart,
  clearCart
} = require('../controllers/cartController');
const { optionalProtect } = require('../middleware/auth');

// Apply optionalProtect to all cart routes so req.user is set when logged in
router.use(optionalProtect);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);
router.put('/order-type', updateOrderType);
router.post('/apply-coupon', applyCouponToCart);
router.post('/merge', mergeCart);
router.delete('/', clearCart);

module.exports = router;
