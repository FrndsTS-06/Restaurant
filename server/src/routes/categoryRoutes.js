const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryByIdentifier,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');
const { validateCategoryPayload } = require('../validators/categoryValidator');

router.get('/', getAllCategories);
router.get('/:identifier', getCategoryByIdentifier);

// Admin protected endpoints
router.post('/', protect, authorize('admin'), validateCategoryPayload, createCategory);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), validateCategoryPayload, updateCategory);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteCategory);

module.exports = router;
