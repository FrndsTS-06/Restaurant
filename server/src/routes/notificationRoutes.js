const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotificationById,
  retryFailedNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.use(protect);
router.use(authorize('admin', 'staff'));

router.get('/', getNotifications);
router.get('/:id', validateObjectId('id'), getNotificationById);
router.post('/:id/retry', validateObjectId('id'), retryFailedNotification);

module.exports = router;
