const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getPayments,
  refundPayment,
  getReport
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes strictly require authentication and Admin role
router.use(protect);
router.use(authorize('admin'));

// 1. Dashboard analytics & KPI aggregates
router.get('/analytics', getDashboardAnalytics);

// 2. Customer management
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.patch('/customers/:id/status', updateCustomerStatus);

// 3. Staff management
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

// 4. Payments and transactions
router.get('/payments', getPayments);
router.post('/payments/:id/refund', refundPayment);

// 5. Reports export (JSON / CSV)
router.get('/reports/:type', getReport);

module.exports = router;
