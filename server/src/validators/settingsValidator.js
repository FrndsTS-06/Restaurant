const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

const validateSettingsPayload = (req, res, next) => {
  const {
    restaurantName,
    contactEmail,
    contactPhone,
    taxRatePercent,
    bookingDurationMinutes,
    bufferTimeMinutes,
    minNoticeHours,
    maxAdvanceDays
  } = req.body;
  const errors = [];

  if (restaurantName !== undefined) {
    if (typeof restaurantName !== 'string' || restaurantName.trim().length < 2) {
      errors.push('Restaurant name must be at least 2 characters.');
    } else if (restaurantName.trim().length > 100) {
      errors.push('Restaurant name cannot exceed 100 characters.');
    }
  }

  if (contactEmail !== undefined) {
    if (typeof contactEmail !== 'string' || !EMAIL_REGEX.test(contactEmail.trim())) {
      errors.push('Please provide a valid contact email address.');
    }
  }

  if (contactPhone !== undefined) {
    if (typeof contactPhone !== 'string' || !PHONE_REGEX.test(contactPhone.trim())) {
      errors.push('Please provide a valid contact phone number.');
    }
  }

  if (taxRatePercent !== undefined) {
    const tax = Number(taxRatePercent);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      errors.push('Tax rate percentage must be between 0% and 100%.');
    }
  }

  if (bookingDurationMinutes !== undefined) {
    const duration = parseInt(bookingDurationMinutes, 10);
    if (isNaN(duration) || duration < 30 || duration > 240) {
      errors.push('Booking duration must be between 30 and 240 minutes.');
    }
  }

  if (bufferTimeMinutes !== undefined) {
    const buffer = parseInt(bufferTimeMinutes, 10);
    if (isNaN(buffer) || buffer < 0 || buffer > 60) {
      errors.push('Buffer interval between seatings must be between 0 and 60 minutes.');
    }
  }

  if (minNoticeHours !== undefined) {
    const notice = Number(minNoticeHours);
    if (isNaN(notice) || notice < 0 || notice > 168) {
      errors.push('Minimum notice hours must be between 0 and 168 hours.');
    }
  }

  if (maxAdvanceDays !== undefined) {
    const advance = parseInt(maxAdvanceDays, 10);
    if (isNaN(advance) || advance < 1 || advance > 365) {
      errors.push('Maximum advance booking days must be between 1 and 365 days.');
    }
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

module.exports = { validateSettingsPayload };
