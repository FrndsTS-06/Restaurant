const mongoose = require('mongoose');
const path = require('path');
const assert = require('assert');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurantpro_db';
const BASE_URL = 'http://localhost:5000';

const testResults = [];
function record(testName, passed, detail = '') {
  testResults.push({ testName, passed, detail });
  const icon = passed ? '✅' : '❌';
  console.log(`   ${icon} ${testName}${detail ? ` (${detail})` : ''}`);
}

// Simulated Client Currency Formatter (Exact matching implementation from client/src/utils/formatters.js)
function formatPrice(amount, currency = 'INR', options = {}) {
  const num = Number(amount) || 0;
  const curr = (currency || 'INR').toUpperCase();
  const locale = curr === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(num);
}

function formatPaise(paise) {
  return formatPrice((Number(paise) || 0) / 100, 'INR');
}

async function runCurrencyVerification() {
  console.log('\n=============================================================');
  console.log('🏛️  PHASE 2: INDIAN RUPEE (INR ₹) FINANCIAL AUDIT & TEST SUITE');
  console.log('=============================================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // -------------------------------------------------------------
  // TEST GROUP 1: Centralized Formatter & Indian Number Grouping
  // -------------------------------------------------------------
  console.log('--- 1. Testing Centralized Currency Formatter (en-IN, ₹, Grouping) ---');
  
  const standardPrice = formatPrice(24.50);
  record('Formats standard price with ₹ and 2 decimals', standardPrice === '₹24.50', standardPrice);

  const roundedZeroPrice = formatPrice(0);
  record('Formats zero amount properly as ₹0.00', roundedZeroPrice === '₹0.00', roundedZeroPrice);

  const smallAmount = formatPrice(0.05);
  record('Handles micro decimal precision', smallAmount === '₹0.05', smallAmount);

  // Indian Number Grouping: Lakhs (1,25,000.00) vs Western (125,000.00)
  const lakhAmount = formatPrice(125000);
  record('Applies authentic Indian grouping for Lakhs (₹1,25,000.00)', lakhAmount === '₹1,25,000.00', lakhAmount);

  const croreAmount = formatPrice(10000000);
  record('Applies authentic Indian grouping for Crores (₹1,00,00,000.00)', croreAmount === '₹1,00,00,000.00', croreAmount);

  // Subunit Paise formatting
  const paiseFormatted = formatPaise(2450);
  record('Subunits conversion: 2450 paise -> ₹24.50', paiseFormatted === '₹24.50', paiseFormatted);

  // Backward compatibility with historical USD orders
  const historicalUsd = formatPrice(126.65, 'USD');
  record('Backward compatibility: Formats USD orders as $126.65', historicalUsd === '$126.65', historicalUsd);

  // -------------------------------------------------------------
  // TEST GROUP 2: Restaurant Settings & API Endpoints
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Restaurant Settings & Public API Responses ---');
  
  const settingsRes = await fetch(`${BASE_URL}/api/settings`);
  const settingsJson = await settingsRes.json();
  record('GET /api/settings returns HTTP 200', settingsRes.status === 200);
  record('Restaurant settings currency configured as INR', settingsJson.data?.currency === 'INR', settingsJson.data?.currency);
  record('Restaurant settings symbol configured as ₹', settingsJson.data?.currencySymbol === '₹', settingsJson.data?.currencySymbol);

  // Payment public config
  const payConfigRes = await fetch(`${BASE_URL}/api/payments/config`);
  const payConfigJson = await payConfigRes.json();
  record('GET /api/payments/config returns HTTP 200', payConfigRes.status === 200);
  record('Payment gateway currency configured as INR', payConfigJson.data?.currency === 'INR', payConfigJson.data?.currency);

  // -------------------------------------------------------------
  // TEST GROUP 3: Order Lifecycle, Server Pricing & Subunit Paise
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Order Creation, Server Pricing & Subunit Calculation ---');

  // Fetch a sample active dish
  const dish = await db.collection('menuitems').findOne({ isAvailable: true, isArchived: { $ne: true } });
  assert(dish, 'Sample dish must exist in database');

  const clientSessionId = `test_inr_${Date.now()}`;
  
  // Create an order via API
  const orderPayload = {
    customer: {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.in',
      phone: '+91 98765 43210'
    },
    items: [
      {
        menuItemId: String(dish._id),
        name: dish.name,
        price: 0.01, // Client attempt to tamper price must be rejected/ignored
        quantity: 2
      }
    ],
    orderType: 'delivery',
    deliveryAddress: {
      street: '42 MG Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038'
    },
    paymentMethod: 'razorpay'
  };

  const createRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  const createJson = await createRes.json();
  record('POST /api/orders created successfully', createRes.status === 201, `Order: ${createJson.data?.orderNumber}`);
  
  const createdOrder = createJson.data;
  record('New order records currency as INR', createdOrder.currency === 'INR', createdOrder.currency);

  // Verify server-side pricing math
  const expectedSubtotal = Math.round(dish.price * 2 * 100) / 100;
  record(`Subtotal calculated from strict DB snapshot (${dish.price} × 2 = ₹${expectedSubtotal})`,
    createdOrder.subtotal === expectedSubtotal, `Actual: ₹${createdOrder.subtotal}`);

  const expectedTax = Math.round(expectedSubtotal * 0.0825 * 100) / 100;
  record(`Sales tax (8.25%) computed correctly (₹${expectedTax})`,
    createdOrder.tax === expectedTax, `Actual: ₹${createdOrder.tax}`);

  const expectedDeliveryFee = expectedSubtotal >= 100 ? 0 : 5.00;
  record(`Delivery fee accurately assessed (threshold ₹100: fee ₹${expectedDeliveryFee})`,
    createdOrder.deliveryFee === expectedDeliveryFee, `Actual: ₹${createdOrder.deliveryFee}`);

  const expectedTotal = Math.round((expectedSubtotal + expectedTax + expectedDeliveryFee) * 100) / 100;
  record(`Total calculated strictly on server (₹${expectedTotal})`,
    createdOrder.totalAmount === expectedTotal, `Actual: ₹${createdOrder.totalAmount}`);

  // Test Razorpay Order Generation with integer paise
  const rzpRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: createdOrder._id })
  });
  const rzpJson = await rzpRes.json();
  record('POST /api/payments/create-order initialized Razorpay order', rzpRes.status === 200);
  record('Razorpay order amount in integer paise (amount * 100)',
    rzpJson.data?.amount === Math.round(expectedTotal * 100), `Paise: ${rzpJson.data?.amount}`);
  record('Razorpay order currency set to INR', rzpJson.data?.currency === 'INR', rzpJson.data?.currency);

  // -------------------------------------------------------------
  // TEST GROUP 4: Historical Data Preservation
  // -------------------------------------------------------------
  console.log('\n--- 4. Verifying Historical Financial Integrity ---');

  const historicalOrders = await db.collection('orders').find({ currency: 'USD' }).toArray();
  record(`Historical USD orders preserved in database (${historicalOrders.length} records)`,
    historicalOrders.length > 0, `Count: ${historicalOrders.length}`);

  if (historicalOrders.length > 0) {
    const sampleHistorical = historicalOrders[0];
    record(`Sample historical order #${sampleHistorical.orderNumber} retains original total ($${sampleHistorical.totalAmount}) and currency: USD`,
      sampleHistorical.currency === 'USD' && sampleHistorical.totalAmount > 0,
      `Order #${sampleHistorical.orderNumber}: $${sampleHistorical.totalAmount}`);
  }

  // Cleanup test order
  await db.collection('orders').deleteOne({ _id: new mongoose.Types.ObjectId(createdOrder._id) });
  await db.collection('payments').deleteMany({ order: new mongoose.Types.ObjectId(createdOrder._id) });

  // -------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------
  console.log('\n=============================================================');
  const allPassed = testResults.every(t => t.passed);
  const total = testResults.length;
  const passedCount = testResults.filter(t => t.passed).length;
  console.log(`📊 PHASE 2 TEST SUMMARY: ${passedCount}/${total} Passed (${Math.round((passedCount/total)*100)}%)`);
  if (allPassed) {
    console.log('🎉 ALL PHASE 2 ACCEPTANCE CRITERIA VERIFIED AND PASSING!');
  } else {
    console.log('⚠️ Some tests failed. Review details above.');
  }
  console.log('=============================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runCurrencyVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
