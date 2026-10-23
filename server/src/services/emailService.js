const nodemailer = require('nodemailer');
const {
  EMAIL_DEV_MODE,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM
} = require('../config/env');
const Notification = require('../models/Notification');

// In-memory development/test outbox for local inspection and assertions
const devOutbox = [];

const getDevOutbox = () => [...devOutbox];
const clearDevOutbox = () => {
  devOutbox.length = 0;
};

// Initialize Nodemailer transporter
let transporter = null;

if (!EMAIL_DEV_MODE && SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  } catch (err) {
    console.warn('⚠️ SMTP Transporter init warning:', err.message);
  }
}

/**
 * Core dispatch function with Notification record tracking and retry logging
 */
const sendEmail = async ({
  recipientEmail,
  recipientName = '',
  type,
  subject,
  html,
  text = '',
  referenceId = null,
  referenceModel = '',
  metadata = {}
}) => {
  // 1. Create initial pending Notification record in DB
  const notification = await Notification.create({
    recipient: {
      email: recipientEmail.toLowerCase().trim(),
      name: recipientName
    },
    type,
    referenceId,
    referenceModel,
    subject,
    bodyHtml: html,
    bodyText: text,
    status: 'pending',
    deliveryAttempts: 0,
    metadata
  });

  return await executeDelivery(notification);
};

/**
 * Execute actual delivery (safe local dev mode vs real SMTP) and update notification state
 */
const executeDelivery = async (notification) => {
  notification.deliveryAttempts += 1;
  notification.lastAttemptAt = new Date();

  try {
    if (EMAIL_DEV_MODE || !transporter) {
      // Safe local development mode / test mode
      const deliveryReceipt = {
        notificationId: notification._id,
        to: notification.recipient.email,
        from: EMAIL_FROM,
        subject: notification.subject,
        sentAt: new Date(),
        html: notification.bodyHtml
      };

      devOutbox.push(deliveryReceipt);

      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();

      return {
        success: true,
        devMode: true,
        notificationId: notification._id,
        messageId: `dev_${notification._id}`
      };
    }

    // Production SMTP delivery
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: notification.recipient.email,
      subject: notification.subject,
      text: notification.bodyText || notification.subject,
      html: notification.bodyHtml
    });

    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();

    return {
      success: true,
      notificationId: notification._id,
      messageId: info.messageId
    };
  } catch (err) {
    notification.status = 'failed';
    notification.errorLogs.push({
      attempt: notification.deliveryAttempts,
      error: err.message,
      timestamp: new Date()
    });
    await notification.save();

    return {
      success: false,
      notificationId: notification._id,
      error: err.message
    };
  }
};

/**
 * Retry failed notification
 */
const retryNotification = async (notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new Error('Notification record not found');
  }

  if (notification.status === 'sent') {
    return { success: true, message: 'Notification already delivered' };
  }

  if (notification.deliveryAttempts >= notification.maxAttempts) {
    throw new Error(`Maximum retry attempts (${notification.maxAttempts}) exceeded`);
  }

  return await executeDelivery(notification);
};

// ============================================================================
// TRANSACTIONAL EMAIL TEMPLATES
// ============================================================================

/**
 * 1. Order Placed Confirmation Email
 */
const sendOrderPlacedEmail = async (order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #2a2a2a;">
        <td style="padding: 10px 0; color: #fff;">${item.name} x ${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; color: #e6af5d;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #121212; color: #eaeaea; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e6af5d; letter-spacing: 2px; margin: 0;">SAVORIA</h1>
        <p style="color: #a0a0a0; font-size: 13px; margin: 5px 0 0;">HAUTE CUISINE & EPICUREAN DINING</p>
      </div>

      <div style="background-color: #1a1a1a; padding: 25px; border-radius: 6px; border: 1px solid #333;">
        <h2 style="color: #fff; margin-top: 0;">Order #${order.orderNumber} Confirmed</h2>
        <p style="color: #ccc;">Dear ${order.customer.name},</p>
        <p style="color: #aaa; line-height: 1.5;">Thank you for your order. Our culinary brigade has received your request and commenced preparation.</p>

        <h3 style="color: #e6af5d; border-bottom: 1px solid #333; padding-bottom: 8px; margin-top: 20px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #aaa;">
            <span>Subtotal:</span> <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #34d399;"><span>Discount (${order.couponCode}):</span> <span>-$${order.discount.toFixed(2)}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #aaa;">
            <span>Tax (8.25%):</span> <span>$${order.tax.toFixed(2)}</span>
          </div>
          ${order.deliveryFee > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #aaa;"><span>Delivery Fee:</span> <span>$${order.deliveryFee.toFixed(2)}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 17px; color: #fff; margin-top: 10px; border-top: 1px solid #444; padding-top: 10px;">
            <span>Total Payable:</span> <span style="color: #e6af5d;">$${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <p style="font-size: 13px; color: #888; margin-top: 20px;">
          <strong>Service Modality:</strong> <span style="text-transform: capitalize;">${order.orderType}</span><br/>
          <strong>Payment Status:</strong> <span style="text-transform: capitalize;">${order.paymentStatus}</span> (${order.paymentMethod || 'Razorpay'})
        </p>
      </div>

      <div style="text-align: center; margin-top: 25px; color: #666; font-size: 12px;">
        <p>450 Avenue Montaigne, New York, NY 10022 • +1 (212) 555-0840</p>
      </div>
    </div>`;

  return await sendEmail({
    recipientEmail: order.customer.email,
    recipientName: order.customer.name,
    type: 'order_placed',
    subject: `Order Confirmation #${order.orderNumber} — SAVORIA Haute Cuisine`,
    html,
    text: `Your order #${order.orderNumber} has been received. Total: $${order.totalAmount.toFixed(2)}`,
    referenceId: order._id,
    referenceModel: 'Order',
    metadata: { orderNumber: order.orderNumber, total: order.totalAmount }
  });
};

/**
 * 2. Order Status Update Email
 */
const sendOrderStatusUpdateEmail = async (order, newStatus, note = '') => {
  const statusLabels = {
    confirmed: 'Confirmed & Slotted',
    preparing: 'In Preparation by Kitchen Brigade',
    ready: 'Ready for Service / Dispatch',
    completed: 'Delivered / Completed',
    delivered: 'Successfully Delivered',
    cancelled: 'Order Cancelled'
  };

  const statusLabel = statusLabels[newStatus] || newStatus;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #121212; color: #eaeaea; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e6af5d; letter-spacing: 2px; margin: 0;">SAVORIA</h1>
        <p style="color: #a0a0a0; font-size: 13px; margin: 5px 0 0;">ORDER STATUS UPDATE</p>
      </div>

      <div style="background-color: #1a1a1a; padding: 25px; border-radius: 6px; border: 1px solid #333;">
        <h2 style="color: #fff; margin-top: 0;">Order #${order.orderNumber} Status: <span style="color: #e6af5d;">${statusLabel}</span></h2>
        <p style="color: #ccc;">Dear ${order.customer.name},</p>
        <p style="color: #aaa; line-height: 1.5;">Your order status has progressed to <strong>${statusLabel}</strong>.</p>
        ${note ? `<p style="background-color: #262626; padding: 10px; border-left: 3px solid #e6af5d; color: #ddd; font-style: italic;">"${note}"</p>` : ''}

        <p style="color: #888; font-size: 13px; margin-top: 20px;">
          You can track live progress anytime at: <a href="http://localhost:5173/orders/track?email=${encodeURIComponent(order.customer.email)}" style="color: #e6af5d;">Track Live Status</a>
        </p>
      </div>
    </div>`;

  return await sendEmail({
    recipientEmail: order.customer.email,
    recipientName: order.customer.name,
    type: 'order_status_update',
    subject: `Order #${order.orderNumber} Status: ${statusLabel} — SAVORIA`,
    html,
    text: `Your order #${order.orderNumber} is now ${statusLabel}.`,
    referenceId: order._id,
    referenceModel: 'Order',
    metadata: { orderNumber: order.orderNumber, newStatus }
  });
};

/**
 * 3. Table Reservation Confirmation Email
 */
const sendReservationConfirmationEmail = async (reservation) => {
  const guestEmail = reservation.guestEmail || reservation.customer?.email || '';
  const guestName = reservation.guestName || reservation.customer?.name || 'Valued Guest';
  const resCode = reservation.reservationNumber || reservation.reservationCode || 'RES-BOOK';
  const resDate = reservation.reservationDate || reservation.date || '';
  const resTime = reservation.timeSlot || '';
  const partySize = reservation.guestsCount || 2;
  const tableDisplay = reservation.table?.tableNumber || reservation.tableNumber || 'Assigned Table';

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #121212; color: #eaeaea; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e6af5d; letter-spacing: 2px; margin: 0;">SAVORIA</h1>
        <p style="color: #a0a0a0; font-size: 13px; margin: 5px 0 0;">TABLE RESERVATION CONFIRMATION</p>
      </div>

      <div style="background-color: #1a1a1a; padding: 25px; border-radius: 6px; border: 1px solid #333;">
        <h2 style="color: #fff; margin-top: 0;">Reservation #${resCode} Confirmed</h2>
        <p style="color: #ccc;">Dear ${guestName},</p>
        <p style="color: #aaa; line-height: 1.5;">We look forward to welcoming you to SAVORIA Haute Cuisine.</p>

        <div style="background-color: #222; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #333;">
          <p style="margin: 6px 0; color: #ddd;"><strong>Date:</strong> ${resDate}</p>
          <p style="margin: 6px 0; color: #ddd;"><strong>Time:</strong> ${resTime}</p>
          <p style="margin: 6px 0; color: #ddd;"><strong>Party Size:</strong> ${partySize} Guests</p>
          <p style="margin: 6px 0; color: #ddd;"><strong>Table:</strong> ${tableDisplay}</p>
          <p style="margin: 6px 0; color: #ddd;"><strong>Status:</strong> <span style="color: #e6af5d; text-transform: capitalize;">${reservation.status}</span></p>
        </div>

        <p style="color: #888; font-size: 13px;">
          Kindly notify us at least 2 hours in advance should your dining plans change.
        </p>
      </div>
    </div>`;

  return await sendEmail({
    recipientEmail: guestEmail,
    recipientName: guestName,
    type: 'reservation_created',
    subject: `Reservation Confirmed #${resCode} (${resDate} at ${resTime}) — SAVORIA`,
    html,
    text: `Your table reservation #${resCode} for ${partySize} guests on ${resDate} at ${resTime} is confirmed.`,
    referenceId: reservation._id,
    referenceModel: 'Reservation',
    metadata: { reservationCode: resCode, date: resDate, time: resTime }
  });
};

/**
 * 4. Reservation Status Update Email (e.g. cancelled, confirmed)
 */
const sendReservationStatusUpdateEmail = async (reservation, newStatus) => {
  const guestEmail = reservation.guestEmail || reservation.customer?.email || '';
  const guestName = reservation.guestName || reservation.customer?.name || 'Valued Guest';
  const resCode = reservation.reservationNumber || reservation.reservationCode || 'RES-BOOK';
  const resDate = reservation.reservationDate || reservation.date || '';
  const resTime = reservation.timeSlot || '';

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #121212; color: #eaeaea; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e6af5d; letter-spacing: 2px; margin: 0;">SAVORIA</h1>
        <p style="color: #a0a0a0; font-size: 13px; margin: 5px 0 0;">RESERVATION UPDATE</p>
      </div>

      <div style="background-color: #1a1a1a; padding: 25px; border-radius: 6px; border: 1px solid #333;">
        <h2 style="color: #fff; margin-top: 0;">Reservation #${resCode}: <span style="text-transform: capitalize; color: #e6af5d;">${newStatus}</span></h2>
        <p style="color: #ccc;">Dear ${guestName},</p>
        <p style="color: #aaa; line-height: 1.5;">
          Your reservation for <strong>${resDate}</strong> at <strong>${resTime}</strong> has been updated to <strong>${newStatus}</strong>.
        </p>
      </div>
    </div>`;

  return await sendEmail({
    recipientEmail: guestEmail,
    recipientName: guestName,
    type: 'reservation_status_update',
    subject: `Reservation #${resCode} Update (${newStatus}) — SAVORIA`,
    html,
    text: `Your reservation #${resCode} has been updated to ${newStatus}.`,
    referenceId: reservation._id,
    referenceModel: 'Reservation',
    metadata: { reservationCode: resCode, newStatus }
  });
};

/**
 * 5. Contact Form Inquiry Acknowledgment Email
 */
const sendContactFormAcknowledgmentEmail = async (messageDoc) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #121212; color: #eaeaea; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e6af5d; letter-spacing: 2px; margin: 0;">SAVORIA</h1>
        <p style="color: #a0a0a0; font-size: 13px; margin: 5px 0 0;">CONCIERGE INQUIRY RECEIVED</p>
      </div>

      <div style="background-color: #1a1a1a; padding: 25px; border-radius: 6px; border: 1px solid #333;">
        <h2 style="color: #fff; margin-top: 0;">We have received your message</h2>
        <p style="color: #ccc;">Dear ${messageDoc.name},</p>
        <p style="color: #aaa; line-height: 1.5;">
          Thank you for reaching out regarding "<strong>${messageDoc.subject}</strong>". Our dining concierge desk will review your inquiry and respond promptly.
        </p>
      </div>
    </div>`;

  return await sendEmail({
    recipientEmail: messageDoc.email,
    recipientName: messageDoc.name,
    type: 'contact_inquiry',
    subject: `We have received your inquiry: "${messageDoc.subject}" — SAVORIA Concierge`,
    html,
    text: `Thank you for contacting SAVORIA Haute Cuisine. We have received your inquiry regarding "${messageDoc.subject}".`,
    referenceId: messageDoc._id,
    referenceModel: 'ContactMessage',
    metadata: { subject: messageDoc.subject }
  });
};

module.exports = {
  sendEmail,
  executeDelivery,
  retryNotification,
  getDevOutbox,
  clearDevOutbox,
  sendOrderPlacedEmail,
  sendOrderStatusUpdateEmail,
  sendReservationConfirmationEmail,
  sendReservationStatusUpdateEmail,
  sendContactFormAcknowledgmentEmail
};
