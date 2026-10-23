const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

const validateContactForm = (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  } else if (name.trim().length > 100) {
    errors.push('Full name cannot exceed 100 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (phone && phone.trim() !== '') {
    if (!PHONE_REGEX.test(phone.trim())) {
      errors.push('Please provide a valid phone number.');
    } else if (phone.trim().length > 30) {
      errors.push('Phone number cannot exceed 30 characters.');
    }
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length < 2) {
    errors.push('Subject must be at least 2 characters.');
  } else if (subject.trim().length > 150) {
    errors.push('Subject cannot exceed 150 characters.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    errors.push('Message must be at least 5 characters.');
  } else if (message.trim().length > 3000) {
    errors.push('Message cannot exceed 3000 characters.');
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

module.exports = { validateContactForm };
