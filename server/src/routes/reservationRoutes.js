const express = require('express');
const router = express.Router();
const {
  getReservationAvailability,
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservationStatus
} = require('../controllers/reservationController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { validateReservationPayload } = require('../validators/reservationValidator');

// Public availability check
router.get('/availability', getReservationAvailability);

// Customer booking history
router.get('/my-reservations', optionalProtect, getMyReservations);

// Public or customer table booking
router.post('/', optionalProtect, validateReservationPayload, createReservation);

// Customer or admin reservation cancellation
router.post('/:id/cancel', optionalProtect, cancelReservation);

// Admin & Staff view all bookings and update status
router.get('/', protect, authorize('admin', 'staff'), getAllReservations);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateReservationStatus);

module.exports = router;
