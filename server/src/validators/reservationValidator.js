const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateReservationPayload = (req, res, next) => {
  const {
    guestName,
    guestEmail,
    guestPhone,
    guestsCount,
    reservationDate,
    timeSlot,
    specialRequests
  } = req.body;
  const errors = [];

  if (!guestName || typeof guestName !== 'string' || guestName.trim().length < 2) {
    errors.push('Guest name must be at least 2 characters.');
  } else if (guestName.trim().length > 100) {
    errors.push('Guest name cannot exceed 100 characters.');
  }

  if (!guestEmail || typeof guestEmail !== 'string' || !EMAIL_REGEX.test(guestEmail.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!guestPhone || typeof guestPhone !== 'string' || !PHONE_REGEX.test(guestPhone.trim())) {
    errors.push('Please provide a valid phone number.');
  } else if (guestPhone.trim().length > 30) {
    errors.push('Phone number cannot exceed 30 characters.');
  }

  const count = Number(guestsCount);
  if (isNaN(count) || !Number.isInteger(count) || count < 1 || count > 20) {
    errors.push('Guests count must be an integer between 1 and 20.');
  }

  const isValidCalendarDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr.trim())) return false;
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

  if (!isValidCalendarDate(reservationDate)) {
    errors.push('Reservation date must be a valid calendar date in YYYY-MM-DD format.');
  } else {
    // 24-hour buffer allows for timezone differences between client and server
    const now = new Date();
    const minAcceptableDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (reservationDate.trim() < minAcceptableDate) {
      errors.push('Reservation date cannot be in the past.');
    }
  }

  if (!timeSlot || typeof timeSlot !== 'string' || !TIME_REGEX.test(timeSlot.trim())) {
    errors.push('Please select a valid time slot (e.g. 19:00).');
  }

  if (specialRequests && typeof specialRequests === 'string' && specialRequests.trim().length > 500) {
    errors.push('Special requests cannot exceed 500 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

module.exports = { validateReservationPayload };
