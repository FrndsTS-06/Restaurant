const Notification = require('../models/Notification');
const { retryNotification } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all notifications with filtering & pagination (Admin)
// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (search) {
      query.$or = [
        { 'recipient.email': { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved',
      data: notifications,
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

// @desc    Get single notification by ID
// @route   GET /api/notifications/:id
const getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return sendError(res, 'Notification record not found', 404);
    }
    return sendSuccess(res, notification, 'Notification retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Retry delivery of a failed notification (Admin)
// @route   POST /api/notifications/:id/retry
const retryFailedNotification = async (req, res, next) => {
  try {
    const result = await retryNotification(req.params.id);
    const updated = await Notification.findById(req.params.id);

    return sendSuccess(res, {
      result,
      notification: updated
    }, 'Notification delivery retry executed');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  retryFailedNotification
};
