const RestaurantTable = require('../models/RestaurantTable');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all tables
// @route   GET /api/tables
const getAllTables = async (req, res, next) => {
  try {
    const { status, location, minCapacity, isBlocked, includeInactive } = req.query;
    const query = {};

    if (!includeInactive) {
      query.isActive = true;
    }
    if (status) query.status = status;
    if (location) query.location = location;
    if (minCapacity) query.capacity = { $gte: Number(minCapacity) };
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';

    const tables = await RestaurantTable.find(query).sort({ capacity: 1, tableNumber: 1 });
    return sendSuccess(res, tables, 'Restaurant tables retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Get table by ID
// @route   GET /api/tables/:id
const getTableById = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) return sendError(res, 'Table not found', 404);
    return sendSuccess(res, table, 'Table retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Create table (Admin)
// @route   POST /api/tables
const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, minCapacity = 1, location, status, isBlocked = false, blockedReason = '' } = req.body;
    if (!tableNumber || !capacity) {
      return sendError(res, 'tableNumber and capacity are required', 400);
    }

    const existing = await RestaurantTable.findOne({ tableNumber: tableNumber.trim() });
    if (existing) {
      return sendError(res, `Table "${tableNumber}" already exists`, 400);
    }

    const table = await RestaurantTable.create({
      tableNumber: tableNumber.trim(),
      capacity: Number(capacity),
      minCapacity: Number(minCapacity),
      location: location || 'Main Dining Salon',
      status: status || 'available',
      isBlocked: Boolean(isBlocked),
      blockedReason: blockedReason || ''
    });

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'CREATE',
      entity: 'RestaurantTable',
      entityId: String(table._id),
      changes: { tableNumber: table.tableNumber, capacity: table.capacity, location: table.location },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, table, 'Table created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update table (Admin)
// @route   PUT /api/tables/:id
const updateTable = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!table) return sendError(res, 'Table not found', 404);

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'UPDATE',
      entity: 'RestaurantTable',
      entityId: String(table._id),
      changes: req.body,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, table, 'Table updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock on a table (Admin)
// @route   PATCH /api/tables/:id/block
const toggleBlockTable = async (req, res, next) => {
  try {
    const { isBlocked, blockedReason = '' } = req.body;
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) return sendError(res, 'Table not found', 404);

    table.isBlocked = isBlocked !== undefined ? Boolean(isBlocked) : !table.isBlocked;
    table.blockedReason = table.isBlocked ? (blockedReason || 'Blocked by dining manager') : '';
    await table.save();

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'UPDATE',
      entity: 'RestaurantTable',
      entityId: String(table._id),
      changes: { isBlocked: table.isBlocked, blockedReason: table.blockedReason },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, table, `Table ${table.tableNumber} is now ${table.isBlocked ? 'blocked' : 'unblocked'}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete table (Admin)
// @route   DELETE /api/tables/:id
const deleteTable = async (req, res, next) => {
  try {
    const table = await RestaurantTable.findByIdAndDelete(req.params.id);
    if (!table) return sendError(res, 'Table not found', 404);

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'DELETE',
      entity: 'RestaurantTable',
      entityId: String(req.params.id),
      changes: { tableNumber: table.tableNumber },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, null, 'Table deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  toggleBlockTable,
  deleteTable
};
