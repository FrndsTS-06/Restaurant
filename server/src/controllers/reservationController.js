const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const RestaurantTable = require('../models/RestaurantTable');
const RestaurantSettings = require('../models/RestaurantSettings');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendReservationConfirmationEmail, sendReservationStatusUpdateEmail } = require('../services/emailService');

// Convert "HH:mm" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
};

// Convert minutes from midnight to "HH:mm"
const minutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Generate distinct uppercase reservation number
const generateReservationNumber = () => {
  return `RES-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Get current date and time in configured timezone (default America/New_York)
const getNowInTimezone = (timezone = 'America/New_York') => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }); // HH:mm
  return { dateStr, timeStr, now };
};

// Check if two time ranges overlap with buffer: [startA, startA + duration + buffer] vs [startB, startB + duration + buffer]
const isTimeOverlapping = (startA, durationA, startB, durationB, buffer = 15) => {
  const endA = startA + durationA + buffer;
  const endB = startB + durationB + buffer;
  return startA < endB && endA > startB;
};

// Validate calendar date (accounts for actual calendar days and leap years)
const isValidCalendarDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return false;
  const [yStr, mStr, dStr] = dateStr.trim().split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (y < 2020 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return (
    dateObj.getUTCFullYear() === y &&
    dateObj.getUTCMonth() === (m - 1) &&
    dateObj.getUTCDate() === d
  );
};

// In-process reservation lock queue to serialize concurrent reservation writes per date
const reservationDateLocks = new Map();

const withReservationLock = async (date, fn) => {
  const currentPromise = reservationDateLocks.get(date) || Promise.resolve();
  let release;
  const nextPromise = new Promise(resolve => { release = resolve; });
  reservationDateLocks.set(date, nextPromise);

  try {
    await currentPromise;
    return await fn();
  } finally {
    release();
    if (reservationDateLocks.get(date) === nextPromise) {
      reservationDateLocks.delete(date);
    }
  }
};

// @desc    Check available reservation slots for a date & party size
// @route   GET /api/reservations/availability
const getReservationAvailability = async (req, res, next) => {
  try {
    const { date, guestsCount = 2 } = req.query;

    if (!date) {
      return sendError(res, 'date (YYYY-MM-DD) query parameter is required', 400);
    }

    const partySize = Math.max(1, parseInt(guestsCount, 10) || 2);
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({});
    }

    const tz = settings.timezone || 'America/New_York';
    const { dateStr: todayDateStr, timeStr: currentTimeStr } = getNowInTimezone(tz);

    // 1. Check if date is in past
    if (date < todayDateStr) {
      return sendSuccess(res, {
        date,
        guestsCount: partySize,
        isAvailable: false,
        message: 'Cannot book reservations in the past',
        slots: []
      });
    }

    // 2. Check if date is beyond maxAdvanceDays
    const requestedDateObj = new Date(`${date}T12:00:00Z`);
    const todayObj = new Date(`${todayDateStr}T12:00:00Z`);
    const diffDays = Math.ceil((requestedDateObj - todayObj) / (1000 * 60 * 60 * 24));
    if (diffDays > (settings.maxAdvanceDays || 30)) {
      return sendSuccess(res, {
        date,
        guestsCount: partySize,
        isAvailable: false,
        message: `Reservations are only accepted up to ${settings.maxAdvanceDays || 30} days in advance`,
        slots: []
      });
    }

    // 3. Check closed days of week
    const dayOfWeek = requestedDateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz });
    const closedDays = settings.operatingHours?.closedDays || ['Monday'];
    if (closedDays.includes(dayOfWeek)) {
      return sendSuccess(res, {
        date,
        guestsCount: partySize,
        isAvailable: false,
        message: `SAVORIA is closed on ${dayOfWeek}s for culinary R&D`,
        slots: []
      });
    }

    // 4. Check blocked dates
    if (settings.blockedDates && settings.blockedDates.includes(date)) {
      return sendSuccess(res, {
        date,
        guestsCount: partySize,
        isAvailable: false,
        message: 'The restaurant is fully reserved for a private gala on this date',
        slots: []
      });
    }

    // 5. Query eligible tables for this party size
    const eligibleTables = await RestaurantTable.find({
      isActive: { $ne: false },
      isBlocked: { $ne: true },
      capacity: { $gte: partySize }
    }).sort({ capacity: 1 });

    if (eligibleTables.length === 0) {
      return sendSuccess(res, {
        date,
        guestsCount: partySize,
        isAvailable: false,
        message: `No dining tables can accommodate a party of ${partySize}`,
        slots: []
      });
    }

    // 6. Query existing active reservations on this date
    const existingReservations = await Reservation.find({
      reservationDate: date,
      status: { $in: ['confirmed', 'pending', 'seated'] }
    });

    // 7. Generate candidate slots based on operating hours
    const duration = settings.bookingDurationMinutes || 90;
    const buffer = settings.bufferTimeMinutes || 15;
    const interval = settings.slotIntervalMinutes || 30;
    const minNotice = settings.minNoticeHours || 1;

    // Dinner operating hours (and optional lunch)
    const windows = [];
    if (settings.operatingHours?.lunch?.active) {
      windows.push({
        open: timeToMinutes(settings.operatingHours.lunch.open || '12:00'),
        close: timeToMinutes(settings.operatingHours.lunch.close || '15:30')
      });
    }
    if (settings.operatingHours?.dinner?.active !== false) {
      windows.push({
        open: timeToMinutes(settings.operatingHours?.dinner?.open || '17:00'),
        close: timeToMinutes(settings.operatingHours?.dinner?.close || '22:30')
      });
    }

    const candidateSlots = [];
    for (const win of windows) {
      // Last booking start allows dining duration before close
      const lastStart = win.close - duration;
      for (let m = win.open; m <= lastStart; m += interval) {
        candidateSlots.push(minutesToTime(m));
      }
    }

    const currentMinutes = timeToMinutes(currentTimeStr);
    const minNoticeMinutes = minNotice * 60;

    // 8. Compute availability for each slot
    const slots = [];
    for (const slot of candidateSlots) {
      const slotMinutes = timeToMinutes(slot);

      // Minimum notice check if booking for today
      if (date === todayDateStr && (slotMinutes - currentMinutes < minNoticeMinutes)) {
        continue; // Too short notice
      }

      // Check if slot is in blockedTimeSlots
      const isBlockedSlot = settings.blockedTimeSlots?.some(
        b => b.date === date && b.timeSlot === slot
      );
      if (isBlockedSlot) {
        slots.push({
          time: slot,
          available: false,
          reason: 'Slot reserved for private seating',
          remainingTables: 0
        });
        continue;
      }

      // Count tables available for this time window
      let availableTablesCount = 0;
      for (const table of eligibleTables) {
        // Find if this table has an overlapping booking
        const hasOverlap = existingReservations.some(r => {
          if (!r.table) return false;
          if (String(r.table) !== String(table._id)) return false;
          const rStart = timeToMinutes(r.timeSlot);
          return isTimeOverlapping(slotMinutes, duration, rStart, duration, buffer);
        });

        if (!hasOverlap) {
          availableTablesCount++;
        }
      }

      slots.push({
        time: slot,
        available: availableTablesCount > 0,
        remainingTables: availableTablesCount
      });
    }

    return sendSuccess(res, {
      date,
      guestsCount: partySize,
      isAvailable: slots.some(s => s.available),
      timezone: tz,
      slots
    }, 'Availability retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Book a table reservation
// @route   POST /api/reservations
const createReservation = async (req, res, next) => {
  try {
    const {
      guestName,
      guestEmail,
      guestPhone,
      guestsCount,
      reservationDate,
      timeSlot,
      seatingArea = 'Main Dining Salon',
      specialRequests,
      tableNumber: requestedTableNumber
    } = req.body;

    if (!guestName || !guestEmail || !guestPhone || !guestsCount || !reservationDate || !timeSlot) {
      return sendError(res, 'Please provide guest name, email, phone, guests count, date, and time slot', 400);
    }

    const partySize = Number(guestsCount);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      return sendError(res, 'Standard bookings accommodate between 1 and 20 guests. For larger galas, please contact concierge.', 400);
    }

    if (!isValidCalendarDate(reservationDate)) {
      return sendError(res, 'Please provide a valid calendar date in YYYY-MM-DD format.', 400);
    }

    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({});
    }

    const tz = settings.timezone || 'America/New_York';
    const { dateStr: todayDateStr, timeStr: currentTimeStr } = getNowInTimezone(tz);

    // 1. Prevent bookings in the past
    if (reservationDate < todayDateStr) {
      return sendError(res, 'Cannot book reservations in the past', 400);
    }

    // 2. Minimum notice check if booking for today
    const slotMinutes = timeToMinutes(timeSlot);
    const currentMinutes = timeToMinutes(currentTimeStr);
    const minNotice = settings.minNoticeHours || 1;
    if (reservationDate === todayDateStr && (slotMinutes - currentMinutes < (minNotice * 60))) {
      return sendError(res, `Reservations must be booked at least ${minNotice} hour(s) in advance`, 400);
    }

    // 3. Operating hours validation
    const requestedDateObj = new Date(`${reservationDate}T12:00:00Z`);
    const dayOfWeek = requestedDateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz });
    const closedDays = settings.operatingHours?.closedDays || ['Monday'];
    if (closedDays.includes(dayOfWeek)) {
      return sendError(res, `The restaurant is closed on ${dayOfWeek}s`, 400);
    }

    if (settings.blockedDates?.includes(reservationDate)) {
      return sendError(res, 'The restaurant is closed for a private event on this date', 400);
    }

    const duration = settings.bookingDurationMinutes || 90;
    const buffer = settings.bufferTimeMinutes || 15;
    const endTimeSlot = minutesToTime(slotMinutes + duration);

    // Concurrency Lock: Prevent race condition & double booking during simultaneous requests
    return await withReservationLock(reservationDate, async () => {
      // 4. Find all eligible tables
      const tableQuery = {
        isActive: { $ne: false },
        isBlocked: { $ne: true },
        capacity: { $gte: partySize }
      };
      if (requestedTableNumber) {
        tableQuery.tableNumber = requestedTableNumber;
      }

      const eligibleTables = await RestaurantTable.find(tableQuery).sort({ capacity: 1 });
      if (eligibleTables.length === 0) {
        return sendError(res, `No available dining table with capacity for ${partySize} guests`, 400);
      }

      // 5. Overlap Prevention & Safe Table Allocation
      // Retrieve all active reservations on that date
      const activeReservations = await Reservation.find({
        reservationDate,
        status: { $in: ['confirmed', 'pending', 'seated'] }
      });

      let assignedTable = null;
      for (const table of eligibleTables) {
        const hasConflict = activeReservations.some(r => {
          if (!r.table) return false;
          if (String(r.table) !== String(table._id)) return false;
          const rStart = timeToMinutes(r.timeSlot);
          return isTimeOverlapping(slotMinutes, duration, rStart, duration, buffer);
        });

        if (!hasConflict) {
          assignedTable = table;
          break;
        }
      }

      if (!assignedTable) {
        return sendError(
          res,
          `No tables with sufficient capacity are available for party of ${partySize} at ${timeSlot} on ${reservationDate}. All matching tables are reserved.`,
          400
        );
      }

      // 6. Create Reservation
      const reservationNumber = generateReservationNumber();
      const reservation = await Reservation.create({
        reservationNumber,
        user: req.user ? req.user.id : null,
        table: assignedTable._id,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim().toLowerCase(),
        guestPhone: guestPhone.trim(),
        guestsCount: partySize,
        reservationDate,
        timeSlot,
        endTimeSlot,
        seatingArea,
        tableNumber: assignedTable.tableNumber,
        status: 'confirmed',
        specialRequests: specialRequests || ''
      });

      // 7. Audit Log
      await AuditLog.create({
        user: req.user ? req.user.id : null,
        action: 'CREATE',
        entity: 'Reservation',
        entityId: String(reservation._id),
        changes: {
          reservationNumber,
          tableNumber: assignedTable.tableNumber,
          date: reservationDate,
          time: timeSlot,
          guests: partySize
        },
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      }).catch(err => console.warn('AuditLog error:', err.message));

      await reservation.populate('table', 'tableNumber capacity location');

      // Trigger Transactional Email Notification (Non-blocking)
      sendReservationConfirmationEmail(reservation).catch(err =>
        console.warn('Reservation confirmation email note:', err.message)
      );

      return sendSuccess(res, reservation, 'Table reservation confirmed successfully', 201);
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        'This dining table and time slot was just booked by another guest. Please select an alternate time or table.',
        409
      );
    }
    next(error);
  }
};

// @desc    Get customer booking history
// @route   GET /api/reservations/my-reservations
const getMyReservations = async (req, res, next) => {
  try {
    const user = req.user;
    const email = req.query.email;

    let query = {};
    if (user && user.id) {
      if (user.role === 'admin' || user.role === 'staff') {
        query = email ? { guestEmail: email.trim().toLowerCase() } : {};
      } else {
        // Customer strictly restricted to their own account; cannot view others by passing ?email=
        query = { $or: [{ user: user.id }, { guestEmail: (user.email || '').toLowerCase() }] };
      }
    } else if (email) {
      query = { guestEmail: email.trim().toLowerCase() };
    } else {
      return sendError(res, 'Please provide guest email or authenticate to view booking history', 400);
    }

    const reservations = await Reservation.find(query)
      .populate('table', 'tableNumber capacity location')
      .sort({ reservationDate: -1, timeSlot: -1 });

    return sendSuccess(res, reservations, 'Customer booking history retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an eligible reservation (Customer or Admin)
// @route   POST /api/reservations/:id/cancel
const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by guest' } = req.body;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const reservation = isObjectId
      ? await Reservation.findById(id)
      : await Reservation.findOne({ reservationNumber: id.toUpperCase() });

    if (!reservation) {
      return sendError(res, 'Reservation not found', 404);
    }

    if (reservation.status === 'cancelled') {
      return sendError(res, 'This reservation is already cancelled', 400);
    }

    if (['completed', 'rejected'].includes(reservation.status)) {
      return sendError(res, `Cannot cancel reservation in '${reservation.status}' status`, 400);
    }

    // Verify permission to cancel (BOLA / IDOR protection):
    if (req.user) {
      if (req.user.role === 'customer') {
        if (reservation.user && String(reservation.user) !== String(req.user.id)) {
          return sendError(res, 'Forbidden: You do not have permission to cancel this reservation.', 403);
        }
        if (!reservation.user) {
          const userEmail = (req.user.email || '').trim().toLowerCase();
          const resEmail = (reservation.guestEmail || '').trim().toLowerCase();
          if (!resEmail || userEmail !== resEmail) {
            return sendError(res, 'Forbidden: You do not have permission to cancel this reservation.', 403);
          }
        }
      }
      // Staff and Admin are authorized to cancel any reservation
    } else {
      // Unauthenticated caller: must verify guestEmail matching reservation.guestEmail
      const callerEmail = (req.body.guestEmail || req.body.email || req.query.email || '').trim().toLowerCase();
      const resEmail = (reservation.guestEmail || '').trim().toLowerCase();

      if (!callerEmail || callerEmail !== resEmail) {
        return sendError(
          res,
          'Authentication required: Please log in or provide the matching guest email to cancel this reservation.',
          403
        );
      }
    }

    // Check cancellation policy for customer cancellations
    const isCustomer = !req.user || req.user.role === 'customer';
    if (isCustomer) {
      let settings = await RestaurantSettings.findOne();
      const tz = settings?.timezone || 'America/New_York';
      const minNoticeHours = settings?.cancellationNoticeHours || 2;
      const { dateStr: todayDateStr, timeStr: currentTimeStr } = getNowInTimezone(tz);

      // Check if reservation is in the past
      if (reservation.reservationDate < todayDateStr) {
        return sendError(res, 'Cannot cancel past reservations', 400);
      }

      // Check minimum hours notice if cancelling for today
      if (reservation.reservationDate === todayDateStr) {
        const slotMinutes = timeToMinutes(reservation.timeSlot);
        const currentMinutes = timeToMinutes(currentTimeStr);
        if (slotMinutes - currentMinutes < (minNoticeHours * 60)) {
          return sendError(
            res,
            `Reservations must be cancelled at least ${minNoticeHours} hours in advance. Please call the dining concierge directly.`,
            400
          );
        }
      }
    }

    const oldStatus = reservation.status;
    reservation.status = 'cancelled';
    reservation.cancellationReason = reason;
    reservation.cancelledBy = req.user ? req.user.role : 'customer';
    await reservation.save();

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'STATUS_CHANGE',
      entity: 'Reservation',
      entityId: String(reservation._id),
      changes: { oldStatus, newStatus: 'cancelled', reason },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    // Trigger Transactional Email Notification (Non-blocking)
    sendReservationStatusUpdateEmail(reservation, 'cancelled').catch(err =>
      console.warn('Reservation cancellation email note:', err.message)
    );

    return sendSuccess(res, reservation, 'Reservation cancelled successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all table reservations with pagination and filters (Admin)
// @route   GET /api/reservations
const getAllReservations = async (req, res, next) => {
  try {
    const { date, status, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (date) query.reservationDate = date;
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { guestName: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { reservationNumber: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('table', 'tableNumber capacity location')
      .sort({ reservationDate: -1, timeSlot: 1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Reservations retrieved',
      data: reservations,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation status or assign table (Admin)
// @route   PATCH /api/reservations/:id/status
const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tableNumber, cancellationReason, specialRequests } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return sendError(res, 'Reservation not found', 404);
    }

    const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const oldStatus = reservation.status;
    if (status) reservation.status = status;
    if (cancellationReason) reservation.cancellationReason = cancellationReason;
    if (specialRequests !== undefined) reservation.specialRequests = specialRequests;

    // Table reassignment with overlap check
    if (tableNumber && tableNumber !== reservation.tableNumber) {
      const tableDoc = await RestaurantTable.findOne({ tableNumber });
      if (!tableDoc) {
        return sendError(res, `Table ${tableNumber} not found`, 404);
      }

      // Check if new table has overlap
      let settings = await RestaurantSettings.findOne();
      const duration = settings?.bookingDurationMinutes || 90;
      const buffer = settings?.bufferTimeMinutes || 15;
      const slotMinutes = timeToMinutes(reservation.timeSlot);

      const conflicts = await Reservation.find({
        _id: { $ne: reservation._id },
        table: tableDoc._id,
        reservationDate: reservation.reservationDate,
        status: { $in: ['confirmed', 'pending', 'seated'] }
      });

      const hasConflict = conflicts.some(c => {
        const cStart = timeToMinutes(c.timeSlot);
        return isTimeOverlapping(slotMinutes, duration, cStart, duration, buffer);
      });

      if (hasConflict) {
        return sendError(res, `Table ${tableNumber} already has a conflicting reservation at that time`, 400);
      }

      reservation.table = tableDoc._id;
      reservation.tableNumber = tableDoc.tableNumber;
    }

    await reservation.save();
    await reservation.populate('table', 'tableNumber capacity location');

    // Create Audit Log
    await AuditLog.create({
      user: req.user ? req.user.id : null,
      action: 'STATUS_CHANGE',
      entity: 'Reservation',
      entityId: String(id),
      changes: { oldStatus, newStatus: reservation.status, tableNumber: reservation.tableNumber },
      ipAddress: req.ip || '',
    }).catch(err => console.warn('AuditLog error:', err.message));

    if (status && status !== oldStatus) {
      sendReservationStatusUpdateEmail(reservation, status).catch(err =>
        console.warn('Reservation status update email note:', err.message)
      );
    }

    return sendSuccess(res, reservation, 'Reservation updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReservationAvailability,
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservationStatus
};
