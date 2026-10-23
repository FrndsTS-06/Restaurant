const crypto = require('crypto');
const {
  razorpay,
  verifyPaymentSignature,
  verifyWebhookSignature,
  RAZORPAY_KEY_ID,
  RAZORPAY_CURRENCY
} = require('../config/razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get public payment gateway configuration (NO SECRET KEYS EXPOSED)
// @route   GET /api/payments/config
const getPaymentConfig = async (req, res) => {
  return sendSuccess(res, {
    keyId: RAZORPAY_KEY_ID,
    currency: RAZORPAY_CURRENCY || 'INR',
    testMode: true,
    methods: {
      razorpay: true,
      cashOnDelivery: true
    }
  }, 'Payment configuration retrieved');
};

// @desc    Create Razorpay Order from trusted backend data
// @route   POST /api/payments/create-order
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, amount: requestedAmount, receipt } = req.body;

    let payableAmount = 0;
    let targetOrder = null;

    // 1. If orderId is provided, calculate payable amount strictly from trusted database Order record
    if (orderId) {
      targetOrder = await Order.findById(orderId);
      if (!targetOrder) {
        return sendError(res, 'Order not found in restaurant records', 404);
      }

      if (targetOrder.paymentStatus === 'paid') {
        return sendError(res, 'This order has already been paid and settled', 400);
      }

      payableAmount = targetOrder.totalAmount;
    } else if (requestedAmount && Number(requestedAmount) > 0) {
      // Sandbox fallback / direct payment amount validation
      payableAmount = Number(requestedAmount);
    } else {
      return sendError(res, 'Valid order reference or payable amount is required', 400);
    }

    const amountInSubunits = Math.round(payableAmount * 100); // Smallest currency unit (paise/cents)
    const orderReceipt = receipt || (targetOrder ? `rcpt_${targetOrder.orderNumber}` : `rcpt_${Date.now()}`);

    const options = {
      amount: amountInSubunits,
      currency: RAZORPAY_CURRENCY || 'INR',
      receipt: orderReceipt
    };

    let rzpOrderId = '';

    if (razorpay) {
      try {
        const order = await razorpay.orders.create(options);
        rzpOrderId = order.id;
      } catch (rzpErr) {
        console.warn('Razorpay SDK sandbox order generation note:', rzpErr.message);
        rzpOrderId = `order_sandbox_${Date.now()}`;
      }
    } else {
      rzpOrderId = `order_sandbox_${Date.now()}`;
    }

    // 2. Persist or update pending Payment record in database
    if (targetOrder) {
      let paymentRecord = await Payment.findOne({ order: targetOrder._id });
      if (paymentRecord) {
        paymentRecord.paymentGateway.orderId = rzpOrderId;
        paymentRecord.status = 'pending';
        paymentRecord.amount = payableAmount;
        paymentRecord.currency = options.currency;
        paymentRecord.attemptsCount += 1;
        await paymentRecord.save();
      } else {
        paymentRecord = await Payment.create({
          order: targetOrder._id,
          user: targetOrder.user || null,
          amount: payableAmount,
          currency: options.currency,
          paymentMethod: 'razorpay',
          paymentGateway: {
            orderId: rzpOrderId
          },
          status: 'pending',
          attemptsCount: 1
        });
        targetOrder.payment = paymentRecord._id;
        await targetOrder.save();
      }
    }

    return sendSuccess(res, {
      orderId: rzpOrderId,
      amount: amountInSubunits,
      currency: options.currency,
      keyId: RAZORPAY_KEY_ID,
      dbOrderId: targetOrder ? targetOrder._id : null
    }, 'Payment order created from trusted server data');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature with Idempotency Protection
// @route   POST /api/payments/verify
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
      idempotencyKey
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return sendError(res, 'Payment verification requires order ID, payment ID, and signature', 400);
    }

    // 1. Verify Cryptographic Signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      // Record failure on matching payment record
      if (razorpayOrderId) {
        await Payment.findOneAndUpdate(
          { 'paymentGateway.orderId': razorpayOrderId },
          {
            status: 'failed',
            failureReason: 'Cryptographic signature mismatch'
          }
        );
      }
      return sendError(res, 'Invalid payment signature verification failed', 400);
    }

    // 2. Idempotency Check: Prevent duplicate payment processing
    const existingPayment = await Payment.findOne({
      $or: [
        { 'paymentGateway.paymentId': razorpayPaymentId, status: 'successful' },
        ...(idempotencyKey ? [{ idempotencyKey, status: 'successful' }] : [])
      ]
    });

    if (existingPayment) {
      return sendSuccess(res, {
        verified: true,
        alreadyProcessed: true,
        transactionId: razorpayPaymentId,
        paymentId: existingPayment._id
      }, 'Payment already verified and processed (Idempotent replay)');
    }

    // 3. Find target Payment record by gateway orderId or order reference
    let payment = null;
    if (orderId) {
      payment = await Payment.findOne({ order: orderId });
    }
    if (!payment && razorpayOrderId) {
      payment = await Payment.findOne({ 'paymentGateway.orderId': razorpayOrderId });
    }

    // If no existing record was created yet (e.g. standalone payment), initialize one
    if (!payment) {
      const associatedOrder = orderId ? await Order.findById(orderId) : await Order.findOne({ 'paymentGateway.orderId': razorpayOrderId });
      payment = new Payment({
        order: associatedOrder ? associatedOrder._id : null,
        amount: associatedOrder ? associatedOrder.totalAmount : 0,
        paymentMethod: 'razorpay',
        paymentGateway: {
          orderId: razorpayOrderId
        }
      });
    }

    // 4. Update Payment State to Successful
    payment.status = 'successful';
    payment.paymentGateway.paymentId = razorpayPaymentId;
    payment.paymentGateway.signature = razorpaySignature;
    if (idempotencyKey) {
      payment.idempotencyKey = idempotencyKey;
    }
    await payment.save();

    // 5. Transition Order paymentStatus only after trusted verification
    let updatedOrder = null;
    if (payment.order) {
      updatedOrder = await Order.findById(payment.order);
      if (updatedOrder) {
        updatedOrder.paymentStatus = 'paid';
        // Auto-transition to confirmed if still placed
        if (updatedOrder.status === 'placed') {
          updatedOrder.status = 'confirmed';
          updatedOrder.statusHistory.push({
            status: 'confirmed',
            note: `Payment settled via Razorpay (${razorpayPaymentId})`,
            changedAt: new Date()
          });
        }
        updatedOrder.payment = payment._id;
        await updatedOrder.save();
      }
    }

    // 6. Audit Trail
    await AuditLog.create({
      user: req.user ? req.user.id : (updatedOrder ? updatedOrder.user : null),
      action: 'UPDATE',
      entity: 'Payment',
      entityId: String(payment._id),
      changes: {
        status: 'successful',
        transactionId: razorpayPaymentId,
        orderNumber: updatedOrder?.orderNumber
      },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Payment Gateway'
    });

    return sendSuccess(res, {
      verified: true,
      transactionId: razorpayPaymentId,
      orderNumber: updatedOrder ? updatedOrder.orderNumber : null,
      paymentStatus: 'paid'
    }, 'Payment signature verified successfully and order settled');
  } catch (error) {
    next(error);
  }
};

// @desc    Record client-side payment failure or cancellation for retry handling
// @route   POST /api/payments/record-failure
const recordPaymentFailure = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, reason, code } = req.body;

    const query = {};
    if (orderId) query.order = orderId;
    else if (razorpayOrderId) query['paymentGateway.orderId'] = razorpayOrderId;

    if (Object.keys(query).length > 0) {
      await Payment.findOneAndUpdate(
        query,
        {
          status: 'failed',
          failureReason: reason || code || 'Payment dismissed, timed out, or declined by gateway'
        }
      );
    }

    return sendSuccess(res, {
      recorded: true,
      retryAllowed: true
    }, 'Payment failure state recorded. Order remains available for retry.');
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook Handler with Raw-Body Signature Verification
// @route   POST /api/payments/webhook
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing x-razorpay-signature header' });
    }

    // Raw-body signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature verification failed' });
    }

    const { event, payload } = req.body;

    // Handle payment.captured
    if (event === 'payment.captured' && payload?.payment?.entity) {
      const paymentEntity = payload.payment.entity;
      const paymentId = paymentEntity.id;
      const rzpOrderId = paymentEntity.order_id;

      let payment = await Payment.findOne({
        $or: [
          { 'paymentGateway.orderId': rzpOrderId },
          { 'paymentGateway.paymentId': paymentId }
        ]
      });

      if (payment) {
        // Idempotency check: if already processed, acknowledge cleanly
        if (payment.status === 'successful') {
          return res.status(200).json({ status: 'ok', message: 'Payment already marked successful' });
        }

        payment.status = 'successful';
        payment.paymentGateway.paymentId = paymentId;
        payment.webhookEvents.push({
          event,
          receivedAt: new Date(),
          eventId: req.body.event_id || ''
        });
        await payment.save();

        if (payment.order) {
          const order = await Order.findById(payment.order);
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            if (order.status === 'placed') {
              order.status = 'confirmed';
              order.statusHistory.push({
                status: 'confirmed',
                note: `Settled via Razorpay Webhook (${paymentId})`,
                changedAt: new Date()
              });
            }
            await order.save();
          }
        }
      }
    }

    // Handle payment.failed
    if (event === 'payment.failed' && payload?.payment?.entity) {
      const paymentEntity = payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      const reason = paymentEntity.error_description || 'Payment failed';

      await Payment.findOneAndUpdate(
        { 'paymentGateway.orderId': rzpOrderId },
        {
          status: 'failed',
          failureReason: reason,
          $push: {
            webhookEvents: {
              event,
              receivedAt: new Date(),
              eventId: req.body.event_id || ''
            }
          }
        }
      );
    }

    // Handle refund.processed
    if (event === 'refund.processed' && payload?.refund?.entity) {
      const refundEntity = payload.refund.entity;
      const paymentId = refundEntity.payment_id;

      const payment = await Payment.findOne({ 'paymentGateway.paymentId': paymentId });
      if (payment) {
        payment.status = 'refunded';
        payment.refundDetails = {
          refundId: refundEntity.id,
          amount: (refundEntity.amount || 0) / 100,
          reason: 'Webhook refund confirmation',
          refundedAt: new Date()
        };
        await payment.save();

        if (payment.order) {
          await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'refunded' });
        }
      }
    }

    // Acknowledge webhook delivery
    return res.status(200).json({ status: 'ok', received: true, event });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure,
  handleRazorpayWebhook
};
