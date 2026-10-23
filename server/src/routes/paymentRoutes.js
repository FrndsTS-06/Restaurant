const express = require('express');
const router = express.Router();
const {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure,
  handleRazorpayWebhook
} = require('../controllers/paymentController');

// Public gateway configuration (No secrets exposed)
router.get('/config', getPaymentConfig);

// Payment initiation and signature verification
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/record-failure', recordPaymentFailure);

// Webhook endpoint with raw-body signature verification
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;
