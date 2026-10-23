const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all active categories
// @route   GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    return sendSuccess(res, categories, 'Categories retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by slug or id
// @route   GET /api/categories/:identifier
const getCategoryByIdentifier = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const category = isObjectId
      ? await Category.findById(identifier)
      : await Category.findOne({ slug: identifier.toLowerCase() });

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    return sendSuccess(res, category, 'Category details retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category (Admin)
// @route   POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, displayOrder } = req.body;
    if (!name) {
      return sendError(res, 'Category name is required', 400);
    }

    const category = await Category.create({
      name,
      description,
      image,
      displayOrder: displayOrder || 0
    });

    return sendSuccess(res, category, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    return sendSuccess(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    return sendSuccess(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryByIdentifier,
  createCategory,
  updateCategory,
  deleteCategory
};
