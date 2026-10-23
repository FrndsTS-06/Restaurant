const ContactMessage = require('../models/ContactMessage');
const { sendContactFormAcknowledgmentEmail } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Submit customer contact inquiry with anti-spam protections
// @route   POST /api/contact
const submitContactForm = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      _hp_trap, // Honeypot field: invisible to human users
      _form_time // Client timestamp for minimum completion time check
    } = req.body;

    // 1. Anti-Spam Honeypot Verification
    if (_hp_trap && String(_hp_trap).trim().length > 0) {
      // Silently discard automated spam without alarming bot
      return sendSuccess(res, { submitted: true }, 'Inquiry received');
    }

    // 2. Anti-Spam Time-Trap Verification (Form cannot be filled in less than 1.5 seconds by humans)
    if (_form_time) {
      const formOpenedAt = parseInt(_form_time, 10);
      const now = Date.now();
      if (!isNaN(formOpenedAt) && now - formOpenedAt < 1500) {
        return sendError(res, 'Submission rejected: automated rapid submission detected.', 429);
      }
    }

    // 3. Validation
    if (!name || !email || !subject || !message) {
      return sendError(res, 'Name, email, subject, and message are required fields.', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Please provide a valid email address.', 400);
    }

    // 4. Persistence
    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread',
      ipAddress: req.ip || '127.0.0.1'
    });

    // 5. Send Transactional Acknowledgment Email
    try {
      await sendContactFormAcknowledgmentEmail(contactMessage);
    } catch (err) {
      console.warn('Contact acknowledgment email note:', err.message);
    }

    return sendSuccess(res, contactMessage, 'Your message has been received. Our concierge desk will respond promptly.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact
const getContactMessages = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') query.status = status;

    const total = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Contact messages retrieved',
      data: messages,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact message status (Admin)
// @route   PATCH /api/contact/:id/status
const updateContactMessageStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!message) return sendError(res, 'Contact message not found', 404);
    return sendSuccess(res, message, 'Message status updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contact message (Admin)
// @route   DELETE /api/contact/:id
const deleteContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return sendError(res, 'Contact message not found', 404);
    return sendSuccess(res, null, 'Message deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactForm,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage
};
