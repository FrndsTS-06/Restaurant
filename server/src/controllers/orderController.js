const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const RestaurantTable = require('../models/RestaurantTable');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendOrderPlacedEmail, sendOrderStatusUpdateEmail } = require('../services/emailService');

// Allowed status transitions state machine
const VALID_STATUS_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'delivered'],
  completed: [], // Terminal state
  delivered: [], // Terminal state
  cancelled: []  // Terminal state
};

// Generate distinct uppercase order number
const generateOrderNumber = () => {
  return `SAV-${Math.floor(1000 + Math.random() * 9000)}`;
};

// @desc    Place a new customer food order
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const {
      customer,
      items,
      orderType = 'delivery',
      tableNumber,
      deliveryAddress,
      couponCode,
      specialNotes,
      paymentMethod = 'razorpay',
      idempotencyKey,
      clientTotal,
      totalAmount: providedTotal
    } = req.body;

    const key = idempotencyKey || req.headers['x-idempotency-key'];

    // 1. Idempotency Check: Prevent duplicate order processing
    if (key) {
      const existingOrder = await Order.findOne({ idempotencyKey: key })
        .populate('payment')
        .populate('table');
      if (existingOrder) {
        return sendSuccess(res, existingOrder, 'Order retrieved from existing idempotency record', 200);
      }
    }

    // 2. Validate customer contact details
    if (!customer || !customer.name || !customer.email) {
      return sendError(res, 'Please provide customer name and email address', 400);
    }

    // 3. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Order must contain at least one culinary item', 400);
    }

    // 4. Validate delivery address if modality is delivery
    if (orderType === 'delivery') {
      const hasStreet = deliveryAddress && (deliveryAddress.street || typeof deliveryAddress === 'string');
      if (!hasStreet) {
        return sendError(res, 'Delivery address (street address) is required for delivery orders', 400);
      }
    }

    // 5. Server-side validation of menu availability and price snapshots (NEVER trust client price)
    let calculatedSubtotal = 0;
    const orderItemsSnapshot = [];

    for (const item of items) {
      const menuItemId = item.menuItemId || item.menuItem || item._id;
      if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
        return sendError(res, `Invalid menu item ID specified: ${menuItemId}`, 400);
      }

      const dish = await MenuItem.findById(menuItemId);
      if (!dish) {
        return sendError(res, `Menu item not found: ${item.name || menuItemId}`, 404);
      }

      if (!dish.isAvailable || dish.isArchived) {
        return sendError(res, `"${dish.name}" is currently unavailable or sold out`, 400);
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSubtotal = Math.round(Number(dish.price) * qty * 100) / 100;
      calculatedSubtotal = Math.round((calculatedSubtotal + itemSubtotal) * 100) / 100;

      orderItemsSnapshot.push({
        menuItem: dish._id,
        name: dish.name,
        price: dish.price, // strict DB snapshot
        quantity: qty,
        specialInstructions: item.specialInstructions || ''
      });
    }

    // 6. Calculate tax (8.25% standard sales tax)
    const tax = Math.round(calculatedSubtotal * 0.0825 * 100) / 100;

    // 7. Calculate delivery fee
    let deliveryFee = 0;
    if (orderType === 'delivery') {
      // Free delivery on orders >= $100, else $5.00
      deliveryFee = calculatedSubtotal >= 100 ? 0 : 5.00;
    }

    // 8. Validate coupon discount if code provided
    let discount = 0;
    let appliedCouponCode = '';
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (coupon) {
        const validation = coupon.isValidForOrder(calculatedSubtotal);
        if (validation.valid) {
          discount = validation.discountAmount;
          appliedCouponCode = coupon.code;
        } else {
          return sendError(res, validation.message, 400);
        }
      } else {
        return sendError(res, `Invalid coupon code: "${couponCode}"`, 404);
      }
    }

    // 9. Calculate final backend total
    const serverTotal = Math.max(
      0,
      Math.round((calculatedSubtotal + tax + deliveryFee - discount) * 100) / 100
    );

    // 10. Security: Reject client-tampered totals if explicitly supplied
    const clientProvided = providedTotal !== undefined ? providedTotal : clientTotal;
    if (clientProvided !== undefined && clientProvided !== null) {
      const clientNum = Number(clientProvided);
      if (Math.abs(clientNum - serverTotal) > 0.05) {
        return sendError(
          res,
          `Invalid order total. Client total (${clientNum}) does not match server calculation (${serverTotal}). Client totals are not trusted.`,
          400
        );
      }
    }

    // Check table if dine-in
    let tableDoc = null;
    if (tableNumber) {
      tableDoc = await RestaurantTable.findOne({ tableNumber });
    }

    const orderNumber = generateOrderNumber();

    // 11. Normalize delivery address
    let formattedDeliveryAddress = {};
    if (typeof deliveryAddress === 'string') {
      formattedDeliveryAddress = { street: deliveryAddress, city: '', state: '', zipCode: '' };
    } else if (deliveryAddress && typeof deliveryAddress === 'object') {
      formattedDeliveryAddress = {
        street: deliveryAddress.street || '',
        city: deliveryAddress.city || '',
        state: deliveryAddress.state || '',
        zipCode: deliveryAddress.zipCode || ''
      };
    }

    // 12. Create Order Record
    const order = await Order.create({
      orderNumber,
      idempotencyKey: key || undefined,
      user: req.user ? req.user.id : null,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone ? customer.phone.trim() : ''
      },
      items: orderItemsSnapshot,
      table: tableDoc ? tableDoc._id : null,
      tableNumber: tableNumber || '',
      deliveryAddress: formattedDeliveryAddress,
      orderType,
      subtotal: calculatedSubtotal,
      tax,
      deliveryFee,
      discount,
      couponCode: appliedCouponCode,
      totalAmount: serverTotal,
      currency: 'INR',
      specialNotes: specialNotes || '',
      status: 'placed',
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'placed',
          changedAt: new Date(),
          note: `Order placed via ${orderType} (${paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'})`
        }
      ]
    });

    // 13. Create Payment Record (Pending verification for Razorpay, or awaiting collection for cash)
    const payment = await Payment.create({
      order: order._id,
      user: req.user ? req.user.id : null,
      amount: serverTotal,
      currency: process.env.RAZORPAY_CURRENCY || 'INR',
      paymentMethod,
      status: 'pending'
    });

    order.payment = payment._id;
    await order.save();

    // 14. Auto-clear persistent cart upon successful order
    if (req.user) {
      await Cart.findOneAndUpdate(
        { user: req.user.id },
        { items: [], discount: 0, couponCode: '', subtotal: 0, tax: 0, deliveryFee: 0, totalAmount: 0 }
      );
    }
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    if (sessionId) {
      await Cart.findOneAndUpdate(
        { sessionId },
        { items: [], discount: 0, couponCode: '', subtotal: 0, tax: 0, deliveryFee: 0, totalAmount: 0 }
      );
    }

    // 15. Increment coupon usage count if applied
    if (appliedCouponCode) {
      await Coupon.findOneAndUpdate(
        { code: appliedCouponCode },
        { $inc: { usageCount: 1 } }
      ).catch(err => console.warn('Coupon usageCount increment note:', err.message));
    }

    // 16. Trigger Transactional Email Notification
    try {
      await sendOrderPlacedEmail(order);
    } catch (err) {
      console.warn('Order placed email notification note:', err.message);
    }

    return sendSuccess(res, order, 'Order placed successfully', 201);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey: req.body.idempotencyKey });
      if (existing) {
        return sendSuccess(res, existing, 'Order retrieved from existing idempotency record', 200);
      }
    }
    next(error);
  }
};

// @desc    Get all orders with pagination, status filter, search & sort (Admin)
// @route   GET /api/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, orderType, search, sort, page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'All') query.status = status;
    if (orderType && orderType !== 'All') query.orderType = orderType;

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'customer.email': { $regex: q, $options: 'i' } },
        { 'customer.phone': { $regex: q, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'amount_desc') sortOption = { totalAmount: -1 };
    else if (sort === 'amount_asc') sortOption = { totalAmount: 1 };

    const totalCount = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('table', 'tableNumber location')
      .populate('payment')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      message: 'All orders retrieved',
      data: orders,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasMore: pageNum < totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for customer by email or user ID
// @route   GET /api/orders/my-orders
const getMyOrders = async (req, res, next) => {
  try {
    const user = req.user;
    const email = req.query.email;

    let query = {};
    if (user && user.id) {
      if (user.role === 'admin' || user.role === 'staff') {
        query = email ? { 'customer.email': email.trim().toLowerCase() } : {};
      } else {
        // Customer strictly restricted to their own account; cannot view others by passing ?email=
        query = { $or: [{ user: user.id }, { 'customer.email': (user.email || '').toLowerCase() }] };
      }
    } else if (email) {
      query = { 'customer.email': email.trim().toLowerCase() };
    } else {
      return sendError(res, 'Please provide email or log in to view order history', 400);
    }

    const orders = await Order.find(query)
      .populate('table', 'tableNumber location')
      .populate('items.menuItem', 'name price image category')
      .sort({ createdAt: -1 });

    return sendSuccess(res, orders, 'Customer orders retrieved');
  } catch (error) {
    next(error);
  }
};

// Customer PII protection masking helpers for unverified tracking
const maskCustomerEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
};

const maskCustomerPhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***';
  return `***-***-${digits.slice(-4)}`;
};

const maskDeliveryStreet = (street) => {
  if (!street) return '';
  const words = street.trim().split(/\s+/);
  if (words.length <= 2) return `${words[0]} ***`;
  return `${words.slice(0, 2).join(' ')} *** (Protected)`;
};

// @desc    Get single order by ID or orderNumber with customer verification & PII shielding
// @route   GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const order = isObjectId
      ? await Order.findById(id).populate('items.menuItem').populate('payment').populate('table')
      : await Order.findOne({ orderNumber: id.toUpperCase() }).populate('items.menuItem').populate('payment').populate('table');

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const verifyEmail = (req.query.email || req.headers['x-verify-email'] || '').trim().toLowerCase();
    const verifyPhone = (req.query.phone || req.headers['x-verify-phone'] || '').replace(/\D/g, '');

    const isStaffOrAdmin = req.user && ['admin', 'staff'].includes(req.user.role);
    const isOwner = req.user && (
      (order.user && order.user.toString() === req.user.id) ||
      (order.customer?.email && order.customer.email.toLowerCase() === (req.user.email || '').toLowerCase())
    );
    const isEmailVerified = Boolean(verifyEmail && order.customer?.email && order.customer.email.toLowerCase() === verifyEmail);
    const isPhoneVerified = Boolean(verifyPhone && order.customer?.phone && order.customer.phone.replace(/\D/g, '').endsWith(verifyPhone.slice(-4)));

    const isAuthorized = Boolean(isStaffOrAdmin || isOwner || isEmailVerified || isPhoneVerified);

    if (isAuthorized) {
      const orderData = order.toObject ? order.toObject() : { ...order };
      orderData.isVerifiedCustomer = true;
      return sendSuccess(res, orderData, 'Order retrieved');
    }

    // Unverified guest access: provide tracking timeline and items, but protect sensitive PII
    const sanitizedOrder = order.toObject ? order.toObject() : { ...order };
    sanitizedOrder.isVerifiedCustomer = false;
    if (sanitizedOrder.customer) {
      sanitizedOrder.customer = {
        name: sanitizedOrder.customer.name,
        email: maskCustomerEmail(sanitizedOrder.customer.email),
        phone: maskCustomerPhone(sanitizedOrder.customer.phone)
      };
    }
    if (sanitizedOrder.deliveryAddress && sanitizedOrder.deliveryAddress.street) {
      sanitizedOrder.deliveryAddress = {
        ...sanitizedOrder.deliveryAddress,
        street: maskDeliveryStreet(sanitizedOrder.deliveryAddress.street)
      };
    }
    if (sanitizedOrder.paymentTransactionId) {
      sanitizedOrder.paymentTransactionId = '***REDACTED***';
    }

    return sendSuccess(res, sanitizedOrder, 'Order status retrieved (sensitive PII protected)');
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status with strict transition validation
// @route   PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const order = isObjectId ? await Order.findById(id) : await Order.findOne({ orderNumber: id.toUpperCase() });

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const currentStatus = order.status;
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!validNextStatuses.includes(status)) {
      return sendError(
        res,
        `Cannot transition order from '${currentStatus}' to '${status}'. Valid transitions: ${validNextStatuses.join(', ') || 'None (Terminal state)'}`,
        400
      );
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status transitioned from ${currentStatus} to ${status}`
    });

    // Synchronize Cash on Delivery (COD) payment status upon delivery/completion
    if (['delivered', 'completed'].includes(status) && order.paymentStatus !== 'paid') {
      const associatedPayment = await Payment.findOne({ order: order._id });
      if (associatedPayment && associatedPayment.paymentMethod === 'cash') {
        order.paymentStatus = 'paid';
        associatedPayment.status = 'successful';
        if (!associatedPayment.paymentGateway) associatedPayment.paymentGateway = {};
        associatedPayment.paymentGateway.paymentId = associatedPayment.paymentGateway.paymentId || `cash_collected_${Date.now()}`;
        await associatedPayment.save();
      }
    }

    if (status === 'cancelled') {
      order.cancellationReason = note || 'Cancelled by staff/admin';
      order.cancelledBy = req.user ? req.user.role : 'staff';
      // Mark pending payments as failed
      await Payment.updateMany(
        { order: order._id, status: 'pending' },
        { status: 'failed', failureReason: `Order cancelled by ${order.cancelledBy}` }
      );
    }

    await order.save();

    // Create Audit Log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: String(order._id),
      changes: { oldStatus: currentStatus, newStatus: status, orderNumber: order.orderNumber },
      ipAddress: req.ip || ''
    });

    // Trigger Transactional Email Notification
    sendOrderStatusUpdateEmail(order, status, note).catch(err =>
      console.warn('Order status update email note:', err.message)
    );

    return sendSuccess(res, order, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order (Customer or Staff)
// @route   POST /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Order cancelled by customer' } = req.body;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const order = isObjectId ? await Order.findById(id) : await Order.findOne({ orderNumber: id.toUpperCase() });

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Cancellation is only allowed before order is ready or completed
    const cancellableStatuses = ['placed', 'pending', 'confirmed', 'preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      return sendError(
        res,
        `Cannot cancel order with status '${order.status}'. Orders that are ready or completed cannot be cancelled.`,
        400
      );
    }

    // Verify permission to cancel (BOLA / IDOR protection):
    if (req.user) {
      if (req.user.role === 'customer') {
        if (order.user && String(order.user) !== String(req.user.id)) {
          return sendError(res, 'Forbidden: You do not have permission to cancel this order.', 403);
        }
        if (!order.user) {
          const userEmail = (req.user.email || '').trim().toLowerCase();
          const orderEmail = (order.customer?.email || '').trim().toLowerCase();
          if (!orderEmail || userEmail !== orderEmail) {
            return sendError(res, 'Forbidden: You do not have permission to cancel this order.', 403);
          }
        }
      }
      // Staff and Admin are authorized to cancel any order
    } else {
      // Unauthenticated caller: must verify ownership via matching customerEmail or customerPhone
      const callerEmail = (req.body.customerEmail || req.body.email || req.query.email || '').trim().toLowerCase();
      const callerPhone = (req.body.customerPhone || req.body.phone || req.query.phone || '').trim();
      const orderEmail = (order.customer?.email || '').trim().toLowerCase();
      const orderPhone = (order.customer?.phone || '').trim();

      const emailMatches = callerEmail && callerEmail === orderEmail;
      const phoneMatches = callerPhone && callerPhone === orderPhone;

      if (!emailMatches && !phoneMatches) {
        return sendError(
          res,
          'Authentication required: Please log in or provide your matching customer email/phone to cancel this order.',
          403
        );
      }
    }

    const oldStatus = order.status;
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledBy = req.user ? req.user.role : 'customer';
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      note: `Cancelled (${reason}) from ${oldStatus}`
    });

    await order.save();

    // Mark any pending payments as failed
    await Payment.updateMany(
      { order: order._id, status: 'pending' },
      { status: 'failed', failureReason: `Order cancelled by ${order.cancelledBy}: ${reason}` }
    );

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: String(order._id),
      changes: { oldStatus, newStatus: 'cancelled', reason },
      ipAddress: req.ip || ''
    });

    // Trigger Transactional Email Notification
    sendOrderStatusUpdateEmail(order, 'cancelled', reason).catch(err =>
      console.warn('Order cancel email note:', err.message)
    );

    return sendSuccess(res, order, 'Order has been successfully cancelled');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};
