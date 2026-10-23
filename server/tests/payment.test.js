const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const { RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_KEY_ID } = require('../src/config/env');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const MenuItem = require('../src/models/MenuItem');

let server;
let baseUrl;
let sampleOrder;
let sampleDish;

const generateSignature = (orderId, paymentId, secret = RAZORPAY_KEY_SECRET) => {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
};

const generateWebhookSignature = (bodyBuffer, secret = RAZORPAY_WEBHOOK_SECRET) => {
  return crypto.createHmac('sha256', secret).update(bodyBuffer).digest('hex');
};

test.before(async () => {
  await connectDB();

  // Find or create a test menu item
  sampleDish = await MenuItem.findOne({ isAvailable: true, isArchived: false });
  if (!sampleDish) {
    sampleDish = await MenuItem.create({
      name: 'Sandbox Royal Beef Wellington',
      slug: `sandbox-wellington-${Date.now()}`,
      category: 'mains',
      price: 52.00,
      description: 'Sandbox dish for payment testing',
      isAvailable: true
    });
  }

  // Create a dedicated test order
  sampleOrder = await Order.create({
    orderNumber: `SAV-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: {
      name: 'Lord Montgomery',
      email: 'montgomery@example.com',
      phone: '+15559876543'
    },
    items: [
      {
        menuItem: sampleDish._id,
        name: sampleDish.name,
        price: sampleDish.price,
        quantity: 2
      }
    ],
    subtotal: 104.00,
    tax: 8.58,
    deliveryFee: 0,
    totalAmount: 112.58,
    status: 'placed',
    paymentStatus: 'unpaid',
    orderType: 'delivery',
    deliveryAddress: { street: '10 Downing St', city: 'London', zipCode: 'SW1A' }
  });

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (sampleOrder) {
    await Payment.deleteMany({ order: sampleOrder._id });
    await Order.deleteOne({ _id: sampleOrder._id });
  }
  if (server) server.close();
  await mongoose.connection.close();
});

// ============================================================================
// 1. GATEWAY CONFIGURATION & SECURITY
// ============================================================================

test('GET /api/payments/config returns public key and test mode without exposing secret keys', async () => {
  const res = await fetch(`${baseUrl}/api/payments/config`);
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.keyId, RAZORPAY_KEY_ID);
  assert.strictEqual(json.data.testMode, true);
  assert.strictEqual(json.data.methods.razorpay, true);
  assert.strictEqual(json.data.methods.cashOnDelivery, true);

  // CRITICAL SECURITY CHECK: Secret keys must NEVER be exposed
  assert.strictEqual(json.data.keySecret, undefined);
  assert.strictEqual(json.data.webhookSecret, undefined);
  assert.strictEqual(JSON.stringify(json).includes(RAZORPAY_KEY_SECRET), false);
  assert.strictEqual(JSON.stringify(json).includes(RAZORPAY_WEBHOOK_SECRET), false);
});

// ============================================================================
// 2. CREATE PAYMENT ORDER FROM TRUSTED DATABASE DATA
// ============================================================================

let createdRzpOrderId = '';

test('POST /api/payments/create-order computes payable amount strictly from database Order total', async () => {
  const res = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: sampleOrder._id,
      amount: 1.00 // Intentionally client-falsified amount!
    })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  // Expected amount is 112.58 * 100 = 11258 paise/cents, NOT the client falsified 1.00
  assert.strictEqual(json.data.amount, Math.round(sampleOrder.totalAmount * 100));
  assert.ok(json.data.orderId);
  assert.strictEqual(json.data.keyId, RAZORPAY_KEY_ID);

  createdRzpOrderId = json.data.orderId;

  // Verify Payment record was created/updated in database with status 'pending'
  const paymentRecord = await Payment.findOne({ order: sampleOrder._id });
  assert.ok(paymentRecord);
  assert.strictEqual(paymentRecord.status, 'pending');
  assert.strictEqual(paymentRecord.paymentGateway.orderId, createdRzpOrderId);
});

test('POST /api/payments/create-order rejects nonexistent orderId with 404', async () => {
  const res = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: new mongoose.Types.ObjectId()
    })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 404);
  assert.strictEqual(json.success, false);
});

// ============================================================================
// 3. CRYPTOGRAPHIC SIGNATURE VERIFICATION
// ============================================================================

test('POST /api/payments/verify rejects missing verification fields with 400', async () => {
  const res = await fetch(`${baseUrl}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: sampleOrder._id
      // Missing razorpayOrderId, razorpayPaymentId, razorpaySignature
    })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

test('POST /api/payments/verify rejects invalid / forged cryptographic signature with 400', async () => {
  const fakePaymentId = `pay_fake_${Date.now()}`;
  const badSignature = 'invalid_forged_signature_hex_0123456789abcdef';

  const res = await fetch(`${baseUrl}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: sampleOrder._id,
      razorpayOrderId: createdRzpOrderId,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: badSignature
    })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('Invalid payment signature'));

  // Database check: Payment status should be updated to failed with failureReason recorded
  const paymentRecord = await Payment.findOne({ order: sampleOrder._id });
  assert.strictEqual(paymentRecord.status, 'failed');
  assert.ok(paymentRecord.failureReason.includes('signature mismatch'));
});

// ============================================================================
// 4. PAYMENT FAILURE RECORDING & RETRY CAPABILITY
// ============================================================================

test('POST /api/payments/record-failure records client dismissal or timeout and permits retry', async () => {
  const res = await fetch(`${baseUrl}/api/payments/record-failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: sampleOrder._id,
      razorpayOrderId: createdRzpOrderId,
      reason: 'User closed payment window before authorization'
    })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.recorded, true);
  assert.strictEqual(json.data.retryAllowed, true);

  const paymentRecord = await Payment.findOne({ order: sampleOrder._id });
  assert.strictEqual(paymentRecord.status, 'failed');
  assert.ok(paymentRecord.failureReason.includes('User closed payment window'));
});

test('Payment Retry: Order can generate new payment attempt with incremented attemptsCount', async () => {
  const res = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: sampleOrder._id })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  createdRzpOrderId = json.data.orderId;

  const paymentRecord = await Payment.findOne({ order: sampleOrder._id });
  assert.strictEqual(paymentRecord.status, 'pending');
  assert.ok(paymentRecord.attemptsCount >= 2, 'Attempts count must increment on payment retry');
});

// ============================================================================
// 5. SUCCESSFUL VERIFICATION & ORDER DATABASE RECONCILIATION
// ============================================================================

const validPaymentId = `pay_sandbox_success_${Date.now()}`;
let validSignature = '';

test('POST /api/payments/verify accepts authentic HMAC SHA-256 signature and settles order', async () => {
  validSignature = generateSignature(createdRzpOrderId, validPaymentId);

  const res = await fetch(`${baseUrl}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: sampleOrder._id,
      razorpayOrderId: createdRzpOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature
    })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.verified, true);
  assert.strictEqual(json.data.transactionId, validPaymentId);
  assert.strictEqual(json.data.paymentStatus, 'paid');

  // Verify database reconciliation
  const updatedOrder = await Order.findById(sampleOrder._id);
  assert.strictEqual(updatedOrder.paymentStatus, 'paid');
  assert.strictEqual(updatedOrder.status, 'confirmed');

  const updatedPayment = await Payment.findOne({ order: sampleOrder._id });
  assert.strictEqual(updatedPayment.status, 'successful');
  assert.strictEqual(updatedPayment.paymentGateway.paymentId, validPaymentId);
});

// ============================================================================
// 6. IDEMPOTENCY CONTROLS: PREVENT DUPLICATE PROCESSING
// ============================================================================

test('Idempotency: Re-submitting duplicate payment verification returns 200 without duplicate changes', async () => {
  const res = await fetch(`${baseUrl}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: sampleOrder._id,
      razorpayOrderId: createdRzpOrderId,
      razorpayPaymentId: validPaymentId, // SAME payment ID!
      razorpaySignature: validSignature
    })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.alreadyProcessed, true);
  assert.strictEqual(json.data.transactionId, validPaymentId);
});

// ============================================================================
// 7. AUTHENTICATED WEBHOOK HANDLING WITH RAW-BODY SIGNATURE VERIFICATION
// ============================================================================

test('POST /api/payments/webhook rejects missing x-razorpay-signature header with 400', async () => {
  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'payment.captured' })
  });
  const json = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

test('POST /api/payments/webhook rejects forged webhook signature with 400', async () => {
  const rawPayload = JSON.stringify({ event: 'payment.captured' });
  const badWebhookSig = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': badWebhookSig
    },
    body: rawPayload
  });
  const json = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('signature verification failed'));
});

test('POST /api/payments/webhook processes authentic payment.captured raw-body event', async () => {
  // Create an order specifically for webhook testing
  const webhookOrder = await Order.create({
    orderNumber: `SAV-WH-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: { name: 'Duchess Eleanor', email: 'eleanor@example.com' },
    items: [{ menuItem: sampleDish._id, name: sampleDish.name, price: sampleDish.price, quantity: 1 }],
    totalAmount: sampleDish.price,
    status: 'placed',
    paymentStatus: 'unpaid'
  });

  const webhookRzpOrderId = `order_wh_${Date.now()}`;
  const webhookRzpPaymentId = `pay_wh_${Date.now()}`;

  // Establish pending payment record
  await Payment.create({
    order: webhookOrder._id,
    amount: sampleDish.price,
    currency: 'INR',
    paymentMethod: 'razorpay',
    paymentGateway: { orderId: webhookRzpOrderId },
    status: 'pending'
  });

  const payload = {
    event: 'payment.captured',
    event_id: `evt_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: webhookRzpPaymentId,
          order_id: webhookRzpOrderId,
          amount: Math.round(sampleDish.price * 100),
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  };

  const rawBuffer = Buffer.from(JSON.stringify(payload), 'utf8');
  const validWebhookSig = generateWebhookSignature(rawBuffer);

  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validWebhookSig
    },
    body: rawBuffer
  });
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.status, 'ok');

  // Verify database reconciliation triggered by webhook
  const reconciledOrder = await Order.findById(webhookOrder._id);
  assert.strictEqual(reconciledOrder.paymentStatus, 'paid');
  assert.strictEqual(reconciledOrder.status, 'confirmed');

  const reconciledPayment = await Payment.findOne({ 'paymentGateway.orderId': webhookRzpOrderId });
  assert.strictEqual(reconciledPayment.status, 'successful');
  assert.strictEqual(reconciledPayment.paymentGateway.paymentId, webhookRzpPaymentId);
  assert.strictEqual(reconciledPayment.webhookEvents.length, 1);
  assert.strictEqual(reconciledPayment.webhookEvents[0].event, 'payment.captured');

  // Test duplicate webhook idempotency: sending same webhook payload again returns 200
  const dupRes = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validWebhookSig
    },
    body: rawBuffer
  });
  const dupJson = await dupRes.json();
  assert.strictEqual(dupRes.status, 200);
  assert.strictEqual(dupJson.status, 'ok');

  // Cleanup
  await Payment.deleteOne({ _id: reconciledPayment._id });
  await Order.deleteOne({ _id: webhookOrder._id });
});

// ============================================================================
// 8. CONFIGURABLE CASH ON DELIVERY ALTERNATIVE
// ============================================================================

test('Cash on Delivery: Customer places order with COD without requiring online payment gateway', async () => {
  const codRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Baron Von Klaus', email: 'klaus@example.com', phone: '+15551122334' },
      items: [{ menuItemId: sampleDish._id, quantity: 1 }],
      orderType: 'delivery',
      deliveryAddress: { street: '42 Royal Crescent', city: 'Bath', zipCode: 'BA1 2LS' },
      paymentMethod: 'cash'
    })
  });
  const codJson = await codRes.json();

  assert.strictEqual(codRes.status, 201);
  assert.strictEqual(codJson.success, true);
  assert.strictEqual(codJson.data.status, 'placed');
  assert.strictEqual(codJson.data.paymentStatus, 'unpaid');

  const codPayment = await Payment.findOne({ order: codJson.data._id });
  assert.ok(codPayment);
  assert.strictEqual(codPayment.paymentMethod, 'cash');
  assert.strictEqual(codPayment.status, 'pending');

  // Cleanup
  await Payment.deleteOne({ _id: codPayment._id });
  await Order.deleteOne({ _id: codJson.data._id });
});
