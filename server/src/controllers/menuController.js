const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all menu items with pagination, filtering, sorting, and search
// @route   GET /api/menu
const getAllMenuItems = async (req, res, next) => {
  try {
    const {
      category,
      dietary,
      search,
      minPrice,
      maxPrice,
      isFeatured,
      isAvailable,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Filter query builder
    const query = {};

    if (category && category !== 'All') {
      // Check if category is name or ObjectId
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.categoryRef = category;
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
    }

    if (dietary && dietary !== 'All') {
      query.dietary = dietary;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    if (req.query.includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }

    // Sort order
    let sortOption = { category: 1, name: 1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating_desc') sortOption = { rating: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const totalCount = await MenuItem.countDocuments(query);
    const items = await MenuItem.find(query)
      .populate('categoryRef', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully',
      data: items,
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

// @desc    Get single menu item by ID or slug
// @route   GET /api/menu/:id
const getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const item = isObjectId
      ? await MenuItem.findById(id).populate('categoryRef')
      : await MenuItem.findOne({ slug: id.toLowerCase() }).populate('categoryRef');

    if (!item) {
      return sendError(res, 'Menu item not found', 404);
    }
    return sendSuccess(res, item, 'Menu item retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new menu item (Admin)
// @route   POST /api/menu
const createMenuItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      price,
      costPrice,
      image,
      tags,
      dietary,
      prepTimeMinutes,
      calories,
      isFeatured,
      allergens
    } = req.body;

    if (!name || !description || !category || price === undefined) {
      return sendError(res, 'Please provide name, description, category, and price', 400);
    }

    // Attempt to link categoryRef
    const categoryDoc = await Category.findOne({
      $or: [{ name: new RegExp(`^${category}$`, 'i') }, { slug: category.toLowerCase() }]
    });

    const newItem = await MenuItem.create({
      name,
      description,
      category,
      categoryRef: categoryDoc ? categoryDoc._id : null,
      price: Number(price),
      costPrice: costPrice !== undefined ? Number(costPrice) : 0,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      tags: tags || [],
      dietary: dietary || [],
      allergens: allergens || [],
      ingredients: req.body.ingredients || [],
      prepTimeMinutes: prepTimeMinutes || 20,
      calories: calories || 450,
      isFeatured: Boolean(isFeatured),
      isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true,
      isArchived: Boolean(req.body.isArchived),
      model3dUrl: req.body.model3dUrl || '',
      modelPosterUrl: req.body.modelPosterUrl || image || '',
      modelStatus: req.body.modelStatus || 'missing_asset',
      modelAltText: req.body.modelAltText || ''
    });

    // Create Audit Log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'CREATE',
      entity: 'MenuItem',
      entityId: String(newItem._id),
      changes: { name: newItem.name, price: newItem.price, category: newItem.category },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, newItem, 'Menu item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item (Admin)
// @route   PUT /api/menu/:id
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findById(id);
    if (!item) {
      return sendError(res, 'Menu item not found', 404);
    }

    const updated = await MenuItem.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    // Create Audit Log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'UPDATE',
      entity: 'MenuItem',
      entityId: String(id),
      changes: req.body,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, updated, 'Menu item updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item (Admin)
// @route   DELETE /api/menu/:id
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'Menu item not found', 404);
    }

    // Create Audit Log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'DELETE',
      entity: 'MenuItem',
      entityId: String(id),
      changes: { deletedName: deleted.name },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, null, 'Menu item deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
