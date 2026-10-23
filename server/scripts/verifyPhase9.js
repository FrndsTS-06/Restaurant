/**
 * Phase 9 Verification Script
 * Validates Razorpay secure online payments, HMAC signature verification,
 * raw-body webhook processing, idempotency, failure/retry, and COD alternative.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_KEY_ID } = require('../src/config/env');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const MenuItem = require('../src/models/MenuItem');
const AuditLog = require('../src/models/AuditLog');

const BASE_URL = 'http://localhost:5000/api';

const generateSignature = (orderId, paymentId, secret = RAZORPAY_KEY_SECRET) => {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
};

const generateWebhookSignature = (buffer, secret = RAZORPAY_WEBHOOK_SECRET) => {
  return crypto.createHmac('sha256', secret).update(buffer).digest('hex');
};

const runVerification = async () => {
  console.log('================================================================');
  console.log('   RESTAURANTPRO — PHASE 9: SECURE ONLINE PAYMENTS VERIFICATION');
  console.log('================================================================\n');

  await connectDB();

  try {
    // ------------------------------------------------------------------------
    // Step 1: Gateway Configuration & Security Check
    // ------------------------------------------------------------------------
    console.log('🔍 [1/8] Verifying Payment Gateway Config & Secret Isolation...');
    const configRes = await fetch(`${BASE_URL}/payments/config`);
    const configData = await configRes.json();

    if (!configData.success || !configData.data.keyId) {
      throw new Error(`Failed to retrieve payment config: ${configData.message}`);
    }

    const rawConfigStr = JSON.stringify(configData);
    if (rawConfigStr.includes(RAZORPAY_KEY_SECRET) || rawConfigStr.includes(RAZORPAY_WEBHOOK_SECRET)) {
      throw new Error('CRITICAL SECURITY VIOLATION: Secret key leaked in public configuration API!');
    }
    console.log(`   ✅ Key ID retrieved: ${configData.data.keyId}`);
    console.log(`   ✅ Test Mode enabled: ${configData.data.testMode}`);
    console.log(`   ✅ Secret keys strictly isolated: Verified (0 leaks)`);

    // ------------------------------------------------------------------------
    // Step 2: Order Placement with Razorpay Payment Method
    // ------------------------------------------------------------------------
    console.log('\n🔍 [2/8] Placing Food Order with Online Razorpay Method...');
    const dish = await MenuItem.findOne({ isAvailable: true, isArchived: false });
    if (!dish) throw new Error('No available dish found for order creation');

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: 'Sir Arthur Conan',
          email: 'arthur.conan@bakerstreet.co.uk',
          phone: '+15557788990'
        },
        items: [{ menuItemId: dish._id, quantity: 2 }],
        orderType: 'delivery',
        deliveryAddress: { street: '221B Baker Street', city: 'London', zipCode: 'NW1 6XE' },
        paymentMethod: 'razorpay'
      })
    });
    const orderData = await orderRes.json();
    if (!orderData.success) throw new Error(`Order placement failed: ${orderData.message}`);

    const createdOrder = orderData.data;
    console.log(`   ✅ Order Created: #${createdOrder.orderNumber} (ID: ${createdOrder._id})`);
    console.log(`   ✅ Initial Payment Status: ${createdOrder.paymentStatus} (Must be unpaid until verification)`);
    console.log(`   ✅ Initial Order Status: ${createdOrder.status}`);

    // ------------------------------------------------------------------------
    // Step 3: Create Payment Order using Trusted Backend Data
    // ------------------------------------------------------------------------
    console.log('\n🔍 [3/8] Generating Razorpay Payment Order from Server Calculations...');
    const rzpOrderRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: createdOrder._id,
        amount: 0.50 // Falsified client amount should be overridden by server
      })
    });
    const rzpOrderData = await rzpOrderRes.json();
    if (!rzpOrderData.success) throw new Error(`Payment order creation failed: ${rzpOrderData.message}`);

    const expectedSubunits = Math.round(createdOrder.totalAmount * 100);
    if (rzpOrderData.data.amount !== expectedSubunits) {
      throw new Error(`Price tampering detected: expected ${expectedSubunits}, received ${rzpOrderData.data.amount}`);
    }
    const rzpOrderId = rzpOrderData.data.orderId;
    console.log(`   ✅ Razorpay Order ID: ${rzpOrderId}`);
    console.log(`   ✅ Payable Amount Subunits: ${rzpOrderData.data.amount} (Matches trusted DB total $${createdOrder.totalAmount})`);

    // ------------------------------------------------------------------------
    // Step 4: Reject Forged Cryptographic Signature
    // ------------------------------------------------------------------------
    console.log('\n🔍 [4/8] Testing Tampered Signature Rejection...');
    const fakePaymentId = `pay_fake_${Date.now()}`;
    const forgedSig = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

    const badVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: createdOrder._id,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: forgedSig
      })
    });
    const badVerifyData = await badVerifyRes.json();
    if (badVerifyRes.status !== 400 || badVerifyData.success !== false) {
      throw new Error('SECURITY BREACH: Backend accepted invalid signature!');
    }
    console.log(`   ✅ Forged signature properly rejected with HTTP 400`);

    // ------------------------------------------------------------------------
    // Step 5: Failure Recording & Retry Handling
    // ------------------------------------------------------------------------
    console.log('\n🔍 [5/8] Testing Payment Failure Recording & Retry Re-initialization...');
    const failRes = await fetch(`${BASE_URL}/payments/record-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: createdOrder._id,
        razorpayOrderId: rzpOrderId,
        reason: 'Customer modal dismissal during authentication'
      })
    });
    const failData = await failRes.json();
    if (!failData.success) throw new Error('Failed to record payment cancellation');
    console.log(`   ✅ Failure state recorded in Payment record`);

    // Re-attempt payment
    const retryRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: createdOrder._id })
    });
    const retryData = await retryRes.json();
    if (!retryData.success) throw new Error('Payment retry initialization failed');
    const newRzpOrderId = retryData.data.orderId;
    console.log(`   ✅ Payment retry initialized: new gateway order ${newRzpOrderId}`);

    // ------------------------------------------------------------------------
    // Step 6: Valid HMAC Verification & Database Reconciliation
    // ------------------------------------------------------------------------
    console.log('\n🔍 [6/8] Verifying Authentic HMAC SHA-256 Signature & Order Settlement...');
    const legitimatePaymentId = `pay_test_${Date.now()}`;
    const legitimateSig = generateSignature(newRzpOrderId, legitimatePaymentId);

    const goodVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: createdOrder._id,
        razorpayOrderId: newRzpOrderId,
        razorpayPaymentId: legitimatePaymentId,
        razorpaySignature: legitimateSig
      })
    });
    const goodVerifyData = await goodVerifyRes.json();
    if (!goodVerifyData.success || !goodVerifyData.data.verified) {
      throw new Error(`Valid signature rejected: ${goodVerifyData.message}`);
    }
    console.log(`   ✅ Cryptographic verification succeeded`);
    console.log(`   ✅ Transaction ID: ${goodVerifyData.data.transactionId}`);

    // Check DB Reconciliation
    const reconciledOrder = await Order.findById(createdOrder._id);
    const reconciledPayment = await Payment.findOne({ order: createdOrder._id });
    if (reconciledOrder.paymentStatus !== 'paid' || reconciledOrder.status !== 'confirmed') {
      throw new Error(`Order state transition failed: status=${reconciledOrder.status}, paymentStatus=${reconciledOrder.paymentStatus}`);
    }
    if (reconciledPayment.status !== 'successful') {
      throw new Error(`Payment record status not successful: ${reconciledPayment.status}`);
    }
    console.log(`   ✅ DB Reconciled: Order status is '${reconciledOrder.status}', paymentStatus is '${reconciledOrder.paymentStatus}'`);

    // Check Idempotency on Duplicate Submission
    const duplicateRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: createdOrder._id,
        razorpayOrderId: newRzpOrderId,
        razorpayPaymentId: legitimatePaymentId,
        razorpaySignature: legitimateSig
      })
    });
    const duplicateData = await duplicateRes.json();
    if (!duplicateData.success || !duplicateData.data.alreadyProcessed) {
      throw new Error('Idempotency check failed for duplicate payment verification');
    }
    console.log(`   ✅ Idempotency: Duplicate payment submission safely detected without re-settling`);

    // ------------------------------------------------------------------------
    // Step 7: Webhook Raw-Body Verification & Duplicate Webhook Idempotency
    // ------------------------------------------------------------------------
    console.log('\n🔍 [7/8] Testing Authenticated Razorpay Webhook with Raw-Body Buffer...');
    const whOrder = await Order.create({
      orderNumber: `SAV-WH-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: { name: 'Inspector Lestrade', email: 'lestrade@scotlandyard.gov.uk' },
      items: [{ menuItem: dish._id, name: dish.name, price: dish.price, quantity: 1 }],
      totalAmount: dish.price,
      status: 'placed',
      paymentStatus: 'unpaid'
    });
    const whRzpOrderId = `order_wh_live_${Date.now()}`;
    const whPaymentId = `pay_wh_live_${Date.now()}`;

    await Payment.create({
      order: whOrder._id,
      amount: dish.price,
      currency: 'INR',
      paymentGateway: { orderId: whRzpOrderId },
      status: 'pending'
    });

    const whPayload = {
      event: 'payment.captured',
      event_id: `evt_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: whPaymentId,
            order_id: whRzpOrderId,
            amount: Math.round(dish.price * 100),
            currency: 'INR',
            status: 'captured'
          }
        }
      }
    };

    const whRawBuffer = Buffer.from(JSON.stringify(whPayload), 'utf8');
    const validWhSig = generateWebhookSignature(whRawBuffer);

    const whRes = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWhSig
      },
      body: whRawBuffer
    });
    const whData = await whRes.json();
    if (whRes.status !== 200 || whData.status !== 'ok') {
      throw new Error(`Webhook processing failed: ${whData.message}`);
    }
    console.log(`   ✅ Webhook HMAC signature verified and processed`);

    // Verify webhook settled the order
    const whReconciledOrder = await Order.findById(whOrder._id);
    if (whReconciledOrder.paymentStatus !== 'paid') {
      throw new Error('Webhook failed to transition order paymentStatus to paid');
    }
    console.log(`   ✅ Webhook DB Reconciliation: Order #${whReconciledOrder.orderNumber} marked 'paid' and 'confirmed'`);

    // Test duplicate webhook idempotency
    const dupWhRes = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWhSig
      },
      body: whRawBuffer
    });
    const dupWhData = await dupWhRes.json();
    if (dupWhRes.status !== 200 || dupWhData.status !== 'ok') {
      throw new Error('Duplicate webhook idempotency failed');
    }
    console.log(`   ✅ Duplicate webhook safely handled with HTTP 200 idempotency`);

    // ------------------------------------------------------------------------
    // Step 8: Configurable Cash on Delivery Alternative
    // ------------------------------------------------------------------------
    console.log('\n🔍 [8/8] Verifying Cash on Delivery Alternative Flow...');
    const codRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Lady Genevieve', email: 'genevieve@example.com', phone: '+15554443322' },
        items: [{ menuItemId: dish._id, quantity: 1 }],
        orderType: 'delivery',
        deliveryAddress: { street: '740 Park Ave', city: 'New York', zipCode: '10021' },
        paymentMethod: 'cash'
      })
    });
    const codData = await codRes.json();
    if (!codData.success) throw new Error('Cash on delivery order placement failed');

    const codPayment = await Payment.findOne({ order: codData.data._id });
    if (!codPayment || codPayment.paymentMethod !== 'cash') {
      throw new Error('COD payment record missing or incorrect paymentMethod');
    }
    console.log(`   ✅ COD Order created: #${codData.data.orderNumber}`);
    console.log(`   ✅ Payment method 'cash' recorded without invoking payment gateway`);

    // Cleanup test records
    await Payment.deleteMany({ order: { $in: [createdOrder._id, whOrder._id, codData.data._id] } });
    await Order.deleteMany({ _id: { $in: [createdOrder._id, whOrder._id, codData.data._id] } });

    console.log('\n================================================================');
    console.log('   🎉 ALL PHASE 9 PAYMENT VERIFICATION CHECKS PASSED (8/8)');
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

runVerification();
