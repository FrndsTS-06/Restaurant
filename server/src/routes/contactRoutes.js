const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');
const { validateContactForm } = require('../validators/contactValidator');

// Public contact submission with anti-spam
router.post('/', validateContactForm, submitContactForm);

// Admin contact message management
router.get('/', protect, authorize('admin', 'staff'), getContactMessages);
router.patch('/:id/status', protect, authorize('admin', 'staff'), validateObjectId('id'), updateContactMessageStatus);
router.put('/:id/status', protect, authorize('admin', 'staff'), validateObjectId('id'), updateContactMessageStatus);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteContactMessage);

module.exports = router;
