const express = require('express');
const router = express.Router();

const { getHealthStatus } = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const menuRoutes = require('./menuRoutes');
const cartRoutes = require('./cartRoutes');
const tableRoutes = require('./tableRoutes');
const orderRoutes = require('./orderRoutes');
const reservationRoutes = require('./reservationRoutes');
const paymentRoutes = require('./paymentRoutes');
const couponRoutes = require('./couponRoutes');
const reviewRoutes = require('./reviewRoutes');
const settingsRoutes = require('./settingsRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const uploadRoutes = require('./uploadRoutes');
const adminRoutes = require('./adminRoutes');
const contactRoutes = require('./contactRoutes');
const notificationRoutes = require('./notificationRoutes');

// Live Server & MongoDB Connectivity Route
router.get('/health', getHealthStatus);

// API Resource Endpoints
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu', menuRoutes);
router.use('/cart', cartRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/reservations', reservationRoutes);
router.use('/payments', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

