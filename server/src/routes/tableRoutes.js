const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  toggleBlockTable,
  deleteTable
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.get('/', getAllTables);
router.get('/:id', validateObjectId('id'), getTableById);

// Admin protected endpoints
router.post('/', protect, authorize('admin'), createTable);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), updateTable);
router.patch('/:id/block', protect, authorize('admin'), validateObjectId('id'), toggleBlockTable);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteTable);

module.exports = router;
