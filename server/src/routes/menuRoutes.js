const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { validateMenuItemPayload } = require('../validators/menuValidator');

router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);

// Admin protected endpoints
router.post('/', protect, authorize('admin'), validateMenuItemPayload, createMenuItem);
router.put('/:id', protect, authorize('admin'), validateMenuItemPayload, updateMenuItem);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

module.exports = router;
