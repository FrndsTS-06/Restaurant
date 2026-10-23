const AuditLog = require('../models/AuditLog');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Get audit logs with pagination and filtering (Admin)
// @route   GET /api/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { entity, action, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (entity) query.entity = entity;
    if (action) query.action = action.toUpperCase();

    const totalCount = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Audit logs retrieved',
      data: logs,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
