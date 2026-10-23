const mongoose = require('mongoose');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const RestaurantSettings = require('../models/RestaurantSettings');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Helper to escape CSV fields according to RFC 4180
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// @desc    Get complete real-time dashboard analytics and KPI widgets
// @route   GET /api/admin/analytics
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const settings = (await RestaurantSettings.findOne()) || {};
    const tz = settings.timezone || 'America/New_York';

    // 1. Total orders count
    const totalOrders = await Order.countDocuments({});

    // 2. Pending orders count (needs kitchen / dispatch attention)
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['placed', 'confirmed', 'preparing'] }
    });

    // 3. Today's date calculations
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    // Today's revenue & today's order count
    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const todayRevenue = todayRevenueAgg.length > 0 ? Number(todayRevenueAgg[0].revenue.toFixed(2)) : 0;
    const todayOrdersCount = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].count : 0;

    // Total all-time revenue
    const totalRevenueAgg = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalRevenue = totalRevenueAgg.length > 0 ? Number(totalRevenueAgg[0].revenue.toFixed(2)) : 0;

    // 4. Active reservations (today and future confirmed/seated)
    const activeReservations = await Reservation.countDocuments({
      status: { $in: ['confirmed', 'seated'] },
      reservationDate: { $gte: todayStr }
    });

    const todayReservations = await Reservation.countDocuments({
      status: { $in: ['confirmed', 'seated'] },
      reservationDate: todayStr
    });

    // 5. Total customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 6. Popular Dishes (Aggregated actual order items)
    const popularDishesAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalOrdered: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: '$_id',
          totalOrdered: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] }
        }
      }
    ]);

    // 7. Recent Orders (Latest 6 orders)
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderNumber customer totalAmount status orderType paymentStatus createdAt');

    // 8. Sales Chart (Last 14 days breakdown)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const salesChartAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format sales chart into ordered date slots
    const salesChart = salesChartAgg.map(item => ({
      date: item._id,
      revenue: Number(item.revenue.toFixed(2)),
      orders: item.orders
    }));

    // 9. Order Status Distribution
    const statusDistributionAgg = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const orderStatusDistribution = {
      placed: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };
    statusDistributionAgg.forEach(item => {
      if (item._id && orderStatusDistribution[item._id] !== undefined) {
        orderStatusDistribution[item._id] = item.count;
      }
    });

    return sendSuccess(
      res,
      {
        totalOrders,
        pendingOrders,
        todayRevenue,
        todayOrdersCount,
        totalRevenue,
        activeReservations,
        todayReservations,
        totalCustomers,
        popularDishes: popularDishesAgg,
        recentOrders,
        salesChart,
        orderStatusDistribution
      },
      'Dashboard analytics aggregated successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers with server-side pagination, search, and spending metrics
// @route   GET /api/admin/customers
const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const matchQuery = { role: 'customer' };
    if (search && search.trim()) {
      const q = search.trim();
      matchQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Use aggregation to enrich customer with order counts and total spent
    const customersAgg = await User.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'customerOrders'
        }
      },
      {
        $addFields: {
          ordersCount: { $size: '$customerOrders' },
          totalSpent: {
            $round: [
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$customerOrders',
                        as: 'ord',
                        cond: { $ne: ['$$ord.status', 'cancelled'] }
                      }
                    },
                    as: 'validOrd',
                    in: '$$validOrd.totalAmount'
                  }
                }
              },
              2
            ]
          },
          lastOrderDate: { $max: '$customerOrders.createdAt' }
        }
      },
      {
        $project: {
          password: 0,
          refreshTokens: 0,
          passwordResetToken: 0,
          passwordResetExpires: 0,
          customerOrders: 0
        }
      },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    const totalCount = await User.countDocuments(matchQuery);

    return sendSuccess(
      res,
      customersAgg,
      'Customers retrieved successfully',
      200,
      {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer profile with orders & reservations history
// @route   GET /api/admin/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id).select('-password -refreshTokens');
    if (!customer) {
      return sendError(res, 'Customer record not found', 404);
    }

    const orders = await Order.find({
      $or: [{ user: customer._id }, { 'customer.email': customer.email.toLowerCase() }]
    }).sort({ createdAt: -1 });

    const reservations = await Reservation.find({
      $or: [{ user: customer._id }, { guestEmail: customer.email.toLowerCase() }]
    }).sort({ reservationDate: -1 });

    return sendSuccess(
      res,
      {
        customer,
        orders,
        reservations
      },
      'Customer details retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer status or admin notes
// @route   PATCH /api/admin/customers/:id/status
const updateCustomerStatus = async (req, res, next) => {
  try {
    const { isActive, notes } = req.body;
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (notes !== undefined) updateData.notes = String(notes);

    const customer = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select(
      '-password -refreshTokens'
    );
    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: String(customer._id),
      changes: updateData,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Admin Dashboard'
    });

    return sendSuccess(res, customer, 'Customer status updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get staff accounts with roles and permissions
// @route   GET /api/admin/staff
const getStaff = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { role: { $in: ['admin', 'staff', 'chef'] } };
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }

    const totalCount = await User.countDocuments(query);
    const staff = await User.find(query)
      .select('-password -refreshTokens')
      .sort({ role: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return sendSuccess(res, staff, 'Staff members retrieved', 200, {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new staff member
// @route   POST /api/admin/staff
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role = 'staff', permissions = ['orders', 'reservations'], phone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    if (!['staff', 'chef', 'admin'].includes(role)) {
      return sendError(res, 'Invalid role. Permitted: staff, chef, admin', 400);
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return sendError(res, 'An account with this email already exists', 400);
    }

    const staffMember = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      permissions: Array.isArray(permissions) ? permissions : ['orders', 'reservations'],
      phone: phone || ''
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: String(staffMember._id),
      changes: { role, permissions, email },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Admin Dashboard'
    });

    const safeResponse = staffMember.toObject();
    delete safeResponse.password;
    delete safeResponse.refreshTokens;

    return sendSuccess(res, safeResponse, 'Staff account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff role, permissions, status
// @route   PUT /api/admin/staff/:id
const updateStaff = async (req, res, next) => {
  try {
    const { name, role, permissions, isActive, phone } = req.body;
    const targetId = req.params.id;

    // Safety check: Prevent removing admin role from oneself if alone
    if (String(req.user.id) === String(targetId) && role && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return sendError(res, 'Cannot revoke your own admin rights as the sole administrator', 400);
      }
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (role) updateFields.role = role;
    if (permissions) updateFields.permissions = permissions;
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);
    if (phone !== undefined) updateFields.phone = phone;

    const updated = await User.findByIdAndUpdate(targetId, updateFields, {
      new: true,
      runValidators: true
    }).select('-password -refreshTokens');

    if (!updated) {
      return sendError(res, 'Staff member not found', 404);
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: String(updated._id),
      changes: updateFields,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Admin Dashboard'
    });

    return sendSuccess(res, updated, 'Staff account updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete staff account
// @route   DELETE /api/admin/staff/:id
const deleteStaff = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (String(req.user.id) === String(targetId)) {
      return sendError(res, 'Administrators cannot delete their own active account', 400);
    }

    const staffMember = await User.findByIdAndDelete(targetId);
    if (!staffMember) {
      return sendError(res, 'Staff member not found', 404);
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'DELETE',
      entity: 'User',
      entityId: String(targetId),
      changes: { email: staffMember.email, role: staffMember.role },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Admin Dashboard'
    });

    return sendSuccess(res, null, 'Staff account deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction records with server-side filtering and KPI summaries
// @route   GET /api/admin/payments
const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, search = '', status = '', paymentMethod = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // If search term provided, match transaction or gateway IDs
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { 'paymentGateway.orderId': { $regex: q, $options: 'i' } },
        { 'paymentGateway.paymentId': { $regex: q, $options: 'i' } }
      ];
    }

    const totalCount = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('order', 'orderNumber customer totalAmount status items')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Summary KPIs
    const volumeAgg = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      totalVolume: 0,
      successfulVolume: 0,
      refundedVolume: 0,
      totalCount: 0,
      successfulCount: 0,
      refundedCount: 0
    };

    volumeAgg.forEach(item => {
      summary.totalCount += item.count;
      summary.totalVolume += item.totalAmount;
      if (item._id === 'successful') {
        summary.successfulVolume += item.totalAmount;
        summary.successfulCount += item.count;
      }
      if (item._id === 'refunded') {
        summary.refundedVolume += item.totalAmount;
        summary.refundedCount += item.count;
      }
    });

    summary.totalVolume = Number(summary.totalVolume.toFixed(2));
    summary.successfulVolume = Number(summary.successfulVolume.toFixed(2));
    summary.refundedVolume = Number(summary.refundedVolume.toFixed(2));

    return sendSuccess(
      res,
      {
        payments,
        summary
      },
      'Payments retrieved successfully',
      200,
      {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Process/mark refund on payment record
// @route   POST /api/admin/payments/:id/refund
const refundPayment = async (req, res, next) => {
  try {
    const { reason = 'Customer requested refund' } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return sendError(res, 'Payment record not found', 404);
    }

    if (payment.status === 'refunded') {
      return sendError(res, 'Payment has already been refunded', 400);
    }

    payment.status = 'refunded';
    payment.refundDetails = {
      refundId: `REF-${Date.now().toString().slice(-6)}`,
      amount: payment.amount,
      reason,
      refundedAt: new Date()
    };
    await payment.save();

    // Also update associated Order paymentStatus if available
    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'refunded' });
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'UPDATE',
      entity: 'Payment',
      entityId: String(payment._id),
      changes: { status: 'refunded', reason, amount: payment.amount },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Admin Dashboard'
    });

    return sendSuccess(res, payment, 'Payment refunded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Export permitted business reports (sales, orders, reservations, dishes) in JSON or CSV
// @route   GET /api/admin/reports/:type
const getReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.$lte = e;
    }

    if (type === 'sales') {
      const match = { status: { $ne: 'cancelled' } };
      if (startDate || endDate) match.createdAt = dateFilter;

      const sales = await Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            ordersCount: { $sum: 1 },
            subtotal: { $sum: '$subtotal' },
            tax: { $sum: '$tax' },
            deliveryFee: { $sum: '$deliveryFee' },
            discount: { $sum: '$discount' },
            totalRevenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      if (format === 'csv') {
        let csv = 'Date,Orders,Subtotal,Tax,Delivery Fee,Discount,Total Revenue\n';
        sales.forEach(row => {
          csv += `${escapeCsv(row._id)},${row.ordersCount},${row.subtotal.toFixed(2)},${row.tax.toFixed(2)},${row.deliveryFee.toFixed(2)},${row.discount.toFixed(2)},${row.totalRevenue.toFixed(2)}\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.csv"`);
        return res.send(csv);
      }
      return sendSuccess(res, sales, 'Sales report generated');
    }

    if (type === 'orders') {
      const match = {};
      if (startDate || endDate) match.createdAt = dateFilter;

      const orders = await Order.find(match).sort({ createdAt: -1 });

      if (format === 'csv') {
        let csv = 'Order Number,Date,Customer Name,Email,Phone,Order Type,Status,Payment Status,Items Count,Total Amount\n';
        orders.forEach(o => {
          csv += `${escapeCsv(o.orderNumber)},${escapeCsv(o.createdAt?.toISOString().split('T')[0])},${escapeCsv(o.customer?.name)},${escapeCsv(o.customer?.email)},${escapeCsv(o.customer?.phone)},${escapeCsv(o.orderType)},${escapeCsv(o.status)},${escapeCsv(o.paymentStatus)},${o.items?.length || 0},${o.totalAmount.toFixed(2)}\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="orders-report-${Date.now()}.csv"`);
        return res.send(csv);
      }
      return sendSuccess(res, orders, 'Orders report generated');
    }

    if (type === 'reservations') {
      const match = {};
      if (startDate || endDate) {
        if (startDate) match.reservationDate = { $gte: startDate };
        if (endDate) {
          match.reservationDate = match.reservationDate || {};
          match.reservationDate.$lte = endDate;
        }
      }

      const reservations = await Reservation.find(match).sort({ reservationDate: -1 });

      if (format === 'csv') {
        let csv = 'Reservation Number,Date,Time Slot,Guest Name,Email,Phone,Guests Count,Table,Status,Special Requests\n';
        reservations.forEach(r => {
          csv += `${escapeCsv(r.reservationNumber)},${escapeCsv(r.reservationDate)},${escapeCsv(r.timeSlot)},${escapeCsv(r.guestName)},${escapeCsv(r.guestEmail)},${escapeCsv(r.guestPhone)},${r.guestsCount},${escapeCsv(r.tableNumber || 'Auto')},${escapeCsv(r.status)},${escapeCsv(r.specialRequests)}\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="reservations-report-${Date.now()}.csv"`);
        return res.send(csv);
      }
      return sendSuccess(res, reservations, 'Reservations report generated');
    }

    if (type === 'dishes') {
      const dishes = await MenuItem.find({}).sort({ category: 1, name: 1 });

      // Join with order items to get sales volume
      const orderVolume = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        }
      ]);
      const volMap = {};
      orderVolume.forEach(v => {
        volMap[v._id] = v;
      });

      const reportData = dishes.map(d => {
        const sold = volMap[d.name]?.totalSold || 0;
        const rev = volMap[d.name]?.revenue || 0;
        return {
          id: d._id,
          name: d.name,
          category: d.category,
          price: d.price,
          costPrice: d.costPrice || 0,
          margin: d.costPrice ? Number((d.price - d.costPrice).toFixed(2)) : d.price,
          isAvailable: d.isAvailable,
          rating: d.rating,
          totalSold: sold,
          totalRevenue: Number(rev.toFixed(2))
        };
      });

      if (format === 'csv') {
        let csv = 'Dish Name,Category,Price,Cost Price,Unit Margin,Available,Rating,Total Sold,Total Revenue\n';
        reportData.forEach(r => {
          csv += `${escapeCsv(r.name)},${escapeCsv(r.category)},${r.price.toFixed(2)},${r.costPrice.toFixed(2)},${r.margin.toFixed(2)},${r.isAvailable},${r.rating},${r.totalSold},${r.totalRevenue.toFixed(2)}\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="dishes-performance-${Date.now()}.csv"`);
        return res.send(csv);
      }
      return sendSuccess(res, reportData, 'Dishes performance report generated');
    }

    return sendError(res, `Unknown report type: ${type}. Permitted: sales, orders, reservations, dishes`, 400);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getPayments,
  refundPayment,
  getReport
};
