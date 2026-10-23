const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Helper to get or create cart
const findOrCreateCart = async (userId, sessionId) => {
  let query = {};
  if (userId) {
    query = { user: userId };
  } else if (sessionId) {
    query = { sessionId };
  } else {
    query = { sessionId: `guest_${Date.now()}` };
  }

  let cart = await Cart.findOne(query).populate('items.menuItem', 'name price image isAvailable isArchived');
  if (!cart) {
    cart = await Cart.create({
      user: userId || null,
      sessionId: sessionId || `guest_${Date.now()}`,
      items: []
    });
  }
  return cart;
};

// @desc    Get user/session cart
// @route   GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    const cart = await findOrCreateCart(userId, sessionId);

    // Sync current menu item prices and prune archived or deleted dishes
    for (let i = cart.items.length - 1; i >= 0; i--) {
      const item = cart.items[i];
      const menuItem = item.menuItem;
      if (!menuItem || menuItem.isArchived) {
        cart.items.splice(i, 1);
      } else if (Number(item.price) !== Number(menuItem.price)) {
        item.price = Number(menuItem.price);
      }
    }

    cart.calculateTotals();
    await cart.save();
    return sendSuccess(res, cart, 'Cart retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
const addItemToCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const { menuItemId, quantity = 1, specialInstructions = '' } = req.body;

    const qty = Math.min(100, Math.max(1, parseInt(quantity, 10) || 1));

    if (!menuItemId) {
      return sendError(res, 'menuItemId is required', 400);
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return sendError(res, 'Menu item not found', 404);
    }
    if (!menuItem.isAvailable || menuItem.isArchived) {
      return sendError(res, `"${menuItem.name}" is currently unavailable or sold out`, 400);
    }

    const cart = await findOrCreateCart(userId, sessionId);
    const existingIndex = cart.items.findIndex(
      i => String(i.menuItem._id || i.menuItem) === String(menuItemId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = Math.min(100, cart.items[existingIndex].quantity + qty);
      if (specialInstructions) {
        cart.items[existingIndex].specialInstructions = specialInstructions;
      }
    } else {
      cart.items.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price, // strict DB snapshot
        quantity: qty,
        specialInstructions
      });
    }

    cart.calculateTotals();
    await cart.save();
    await cart.populate('items.menuItem', 'name price image isAvailable isArchived');

    return sendSuccess(res, cart, 'Item added to cart', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update item quantity
// @route   PUT /api/cart/items/:itemId
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const { itemId } = req.params;
    const { quantity, specialInstructions } = req.body;

    const cart = await findOrCreateCart(userId, sessionId);
    const item = cart.items.id(itemId) || cart.items.find(
      i => String(i.menuItem?._id || i.menuItem) === String(itemId)
    );
    if (!item) {
      return sendError(res, 'Cart item not found', 404);
    }

    if (quantity !== undefined) {
      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        cart.items.pull(item._id);
      } else {
        item.quantity = Math.min(100, parsedQty);
      }
    }

    if (specialInstructions !== undefined) {
      item.specialInstructions = specialInstructions;
    }

    cart.calculateTotals();
    await cart.save();
    await cart.populate('items.menuItem', 'name price image isAvailable isArchived');

    return sendSuccess(res, cart, 'Cart item updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const { itemId } = req.params;

    const cart = await findOrCreateCart(userId, sessionId);
    const item = cart.items.id(itemId) || cart.items.find(
      i => String(i.menuItem?._id || i.menuItem) === String(itemId)
    );
    if (!item) {
      return sendError(res, 'Cart item not found', 404);
    }

    cart.items.pull(item._id);
    cart.calculateTotals();
    await cart.save();
    await cart.populate('items.menuItem', 'name price image isAvailable isArchived');

    return sendSuccess(res, cart, 'Item removed from cart');
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart order type (delivery / pickup / dine-in)
// @route   PUT /api/cart/order-type
const updateOrderType = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const { orderType } = req.body;

    if (!orderType || !['delivery', 'pickup', 'dine-in'].includes(orderType)) {
      return sendError(res, 'orderType must be "delivery", "pickup", or "dine-in"', 400);
    }

    const cart = await findOrCreateCart(userId, sessionId);
    cart.orderType = orderType;
    cart.calculateTotals();
    await cart.save();
    await cart.populate('items.menuItem', 'name price image isAvailable isArchived');

    return sendSuccess(res, cart, `Cart modality updated to ${orderType}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/cart/apply-coupon
const applyCouponToCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const { code } = req.body;

    if (!code) {
      return sendError(res, 'Coupon code is required', 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return sendError(res, 'Invalid coupon code', 404);
    }

    const cart = await findOrCreateCart(userId, sessionId);
    const validation = coupon.isValidForOrder(cart.subtotal);
    if (!validation.valid) {
      return sendError(res, validation.message, 400);
    }

    cart.discount = validation.discountAmount;
    cart.couponCode = coupon.code;
    cart.calculateTotals();
    await cart.save();

    return sendSuccess(res, cart, `Coupon '${coupon.code}' applied successfully`);
  } catch (error) {
    next(error);
  }
};

// @desc    Merge guest cart into authenticated user cart
// @route   POST /api/cart/merge
const mergeCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return sendError(res, 'Authentication required to merge cart into user account', 401);
    }

    const sessionId = req.body.sessionId || req.headers['x-session-id'];
    if (!sessionId) {
      const userCart = await findOrCreateCart(userId, null);
      return sendSuccess(res, userCart, 'No guest session provided, returned user cart');
    }

    // Find guest cart
    const guestCart = await Cart.findOne({ sessionId });
    const userCart = await findOrCreateCart(userId, null);

    if (guestCart && guestCart.items && guestCart.items.length > 0) {
      for (const guestItem of guestCart.items) {
        // Verify menuItem is available
        const menuItem = await MenuItem.findById(guestItem.menuItem);
        if (!menuItem || !menuItem.isAvailable || menuItem.isArchived) {
          continue; // skip unavailable items
        }

        const existingIndex = userCart.items.findIndex(
          i => String(i.menuItem._id || i.menuItem) === String(guestItem.menuItem)
        );

        if (existingIndex > -1) {
          userCart.items[existingIndex].quantity += guestItem.quantity;
        } else {
          userCart.items.push({
            menuItem: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: guestItem.quantity,
            specialInstructions: guestItem.specialInstructions || ''
          });
        }
      }

      if (guestCart.couponCode && !userCart.couponCode) {
        userCart.couponCode = guestCart.couponCode;
        userCart.discount = guestCart.discount;
      }

      if (guestCart.orderType) {
        userCart.orderType = guestCart.orderType;
      }

      userCart.calculateTotals();
      await userCart.save();

      // Clear or delete guest cart to prevent duplicate merges
      await Cart.deleteOne({ _id: guestCart._id });
    }

    await userCart.populate('items.menuItem', 'name price image isAvailable isArchived');
    return sendSuccess(res, userCart, 'Guest cart merged successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    const cart = await findOrCreateCart(userId, sessionId);
    cart.items = [];
    cart.discount = 0;
    cart.couponCode = '';
    cart.calculateTotals();
    await cart.save();

    return sendSuccess(res, cart, 'Cart cleared');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  updateOrderType,
  applyCouponToCart,
  mergeCart,
  clearCart
};
