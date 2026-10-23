const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');
const Cart = require('../src/models/Cart');

let server;
let baseUrl;
let adminToken = '';
let customerToken = '';
let availableDish = null;
let soldOutDish = null;

test.before(async () => {
  await connectDB();

  // Pick or create test dishes
  const dishes = await MenuItem.find({ isArchived: false }).limit(2);
  if (dishes.length > 0) {
    availableDish = dishes[0];
    availableDish.isAvailable = true;
    await availableDish.save();
  }

  // Create or find a sold-out dish
  soldOutDish = await MenuItem.findOne({ isAvailable: false });
  if (!soldOutDish) {
    soldOutDish = await MenuItem.create({
      name: 'Sold Out Autumn Truffle Soup',
      slug: `sold-out-soup-${Date.now()}`,
      category: 'starters',
      price: 24.00,
      description: 'Temporary sold out soup for testing',
      isAvailable: false
    });
  }

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
  if (soldOutDish && soldOutDish.name.includes('Autumn Truffle Soup')) {
    await MenuItem.deleteOne({ _id: soldOutDish._id });
  }
  if (server) server.close();
  await mongoose.connection.close();
});

// Setup auth tokens
test('SETUP: Authenticate Admin and Customer users', async () => {
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });
  const adminJson = await adminRes.json();
  assert.strictEqual(adminRes.status, 200);
  adminToken = adminJson.data.token;

  const customerRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
  });
  const customerJson = await customerRes.json();
  assert.strictEqual(customerRes.status, 200);
  customerToken = customerJson.data.token;
});

// ============================================================================
// 1. CART MANAGEMENT & SERVER-SIDE TOTALS
// ============================================================================

const guestSessionId = `test_guest_session_${Date.now()}`;
let cartItemId = '';

test('Cart: Adding sold-out dish to cart is rejected with 400', async () => {
  const res = await fetch(`${baseUrl}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': guestSessionId
    },
    body: JSON.stringify({
      menuItemId: soldOutDish._id,
      quantity: 1
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('unavailable') || json.message.includes('sold out'));
});

test('Cart: Add available dish to cart uses DB snapshot price', async () => {
  const res = await fetch(`${baseUrl}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': guestSessionId
    },
    body: JSON.stringify({
      menuItemId: availableDish._id,
      quantity: 2,
      price: 0.01 // Tampered client price must be ignored!
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.items.length, 1);
  assert.strictEqual(json.data.items[0].price, availableDish.price);
  assert.strictEqual(json.data.items[0].quantity, 2);

  const expectedSubtotal = Math.round(availableDish.price * 2 * 100) / 100;
  assert.strictEqual(json.data.subtotal, expectedSubtotal);
  cartItemId = json.data.items[0]._id;
});

test('Cart: Increase and decrease quantity in cart', async () => {
  // Update to 3
  const res = await fetch(`${baseUrl}/api/cart/items/${cartItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': guestSessionId
    },
    body: JSON.stringify({ quantity: 3 })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.items[0].quantity, 3);
  assert.strictEqual(json.data.subtotal, Math.round(availableDish.price * 3 * 100) / 100);
});

test('Cart: Modality update calculates accurate delivery fee ($5 for delivery)', async () => {
  // Modality: pickup -> $0 delivery fee
  const resPickup = await fetch(`${baseUrl}/api/cart/order-type`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': guestSessionId
    },
    body: JSON.stringify({ orderType: 'pickup' })
  });
  const jsonPickup = await resPickup.json();
  assert.strictEqual(resPickup.status, 200);
  assert.strictEqual(jsonPickup.data.deliveryFee, 0);

  // Modality: delivery -> $5 fee (unless subtotal >= 100)
  const resDelivery = await fetch(`${baseUrl}/api/cart/order-type`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': guestSessionId
    },
    body: JSON.stringify({ orderType: 'delivery' })
  });
  const jsonDelivery = await resDelivery.json();
  assert.strictEqual(resDelivery.status, 200);
  const expectedFee = jsonDelivery.data.subtotal >= 100 ? 0 : 5.00;
  assert.strictEqual(jsonDelivery.data.deliveryFee, expectedFee);
});

test('Cart: Apply coupon code calculates verified discount', async () => {
  const res = await fetch(`${baseUrl}/api/cart/apply-coupon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': guestSessionId
    },
    body: JSON.stringify({ code: 'SAVORIA10' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.couponCode, 'SAVORIA10');
  assert.ok(json.data.discount > 0);
});

// ============================================================================
// 2. GUEST CART TO AUTHENTICATED USER MERGE
// ============================================================================

test('Cart Merge: Merging guest cart aggregates quantities without duplicates', async () => {
  // First, clear customer's existing cart
  await fetch(`${baseUrl}/api/cart`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });

  // Customer adds 1 unit of availableDish to their authenticated cart
  await fetch(`${baseUrl}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ menuItemId: availableDish._id, quantity: 1 })
  });

  // Guest cart has 3 units of availableDish
  // Merge guest cart into customer cart
  const mergeRes = await fetch(`${baseUrl}/api/cart/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ sessionId: guestSessionId })
  });
  const mergeJson = await mergeRes.json();

  assert.strictEqual(mergeRes.status, 200);
  assert.strictEqual(mergeJson.success, true);
  // Must NOT duplicate rows for the same dish
  assert.strictEqual(mergeJson.data.items.length, 1);
  // Total quantity should be 1 + 3 = 4
  assert.strictEqual(mergeJson.data.items[0].quantity, 4);

  // Guest cart should now be cleared/deleted in database
  const checkGuestCart = await Cart.findOne({ sessionId: guestSessionId });
  assert.strictEqual(checkGuestCart, null);
});

// ============================================================================
// 3. ORDER CREATION, SECURITY PRICING & IDEMPOTENCY
// ============================================================================

let createdOrderId = '';
let createdOrderNumber = '';
const testIdempotencyKey = `idem_${Date.now()}_alpha`;

test('Order: Rejects order with unavailable / sold out dish', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Lady Genevieve', email: 'genevieve@example.com', phone: '+15551234567' },
      items: [{ menuItemId: soldOutDish._id, quantity: 1 }],
      orderType: 'pickup'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('unavailable') || json.message.includes('sold out'));
});

test('Order: Rejects delivery order missing street address', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Lady Genevieve', email: 'genevieve@example.com', phone: '+15551234567' },
      items: [{ menuItemId: availableDish._id, quantity: 1 }],
      orderType: 'delivery',
      deliveryAddress: {} // Missing street address
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('Delivery address'));
});

test('Order: Rejects client-tampered totals', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Lady Genevieve', email: 'genevieve@example.com', phone: '+15551234567' },
      items: [{ menuItemId: availableDish._id, quantity: 2 }],
      orderType: 'pickup',
      totalAmount: 1.00 // Falsified total!
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('Invalid order total') || json.message.includes('not match server calculation'));
});

test('Order: Places valid order with backend price snapshot and idempotency key', async () => {
  const subtotal = Math.round(availableDish.price * 2 * 100) / 100;
  const tax = Math.round(subtotal * 0.0825 * 100) / 100;
  const deliveryFee = subtotal >= 100 ? 0 : 5.00;
  const expectedTotal = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      customer: { name: 'Lady Genevieve', email: 'guest@savoria.com', phone: '+15551234567' },
      items: [{ menuItemId: availableDish._id, quantity: 2, price: 0.50 }], // client price ignored
      orderType: 'delivery',
      deliveryAddress: { street: '740 Park Avenue', city: 'New York', zipCode: '10021' },
      idempotencyKey: testIdempotencyKey
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.status, 'placed');
  assert.strictEqual(json.data.subtotal, subtotal);
  assert.strictEqual(json.data.deliveryFee, deliveryFee);
  assert.strictEqual(json.data.totalAmount, expectedTotal);
  assert.strictEqual(json.data.items[0].price, availableDish.price);
  assert.ok(json.data.orderNumber.startsWith('SAV-'));

  createdOrderId = json.data._id;
  createdOrderNumber = json.data.orderNumber;
});

test('Order Idempotency: Duplicate submission returns existing order without creating duplicate record', async () => {
  const countBefore = await Order.countDocuments();

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      customer: { name: 'Lady Genevieve', email: 'guest@savoria.com', phone: '+15551234567' },
      items: [{ menuItemId: availableDish._id, quantity: 2 }],
      orderType: 'delivery',
      deliveryAddress: { street: '740 Park Avenue', city: 'New York', zipCode: '10021' },
      idempotencyKey: testIdempotencyKey // SAME KEY!
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data._id, createdOrderId);
  assert.strictEqual(json.data.orderNumber, createdOrderNumber);

  const countAfter = await Order.countDocuments();
  assert.strictEqual(countAfter, countBefore, 'Database order count must NOT increase');
});

// ============================================================================
// 4. ORDER STATUS TRANSITIONS (Placed -> Confirmed -> Preparing -> Ready -> Completed)
// ============================================================================

test('Status: Invalid jump transition (placed -> ready) returns 400', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'ready' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('Cannot transition order'));
});

test('Status: Valid transition from placed -> confirmed succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'confirmed', note: 'Kitchen brigade received ticket' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.status, 'confirmed');
});

test('Status: Valid transition from confirmed -> preparing succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'preparing' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.status, 'preparing');
});

test('Status: Valid transition from preparing -> ready succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'ready' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.status, 'ready');
});

test('Status: Valid transition from ready -> completed succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'completed' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.status, 'completed');
});

test('Status: Terminal state (completed) rejects further transitions or cancellations', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'cancelled' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

// ============================================================================
// 5. ORDER CANCELLATION RESTRICTIONS & FLOW
// ============================================================================

test('Cancellation: Ready or Completed orders cannot be cancelled', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Customer changed mind' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('cannot be cancelled'));
});

test('Cancellation: Active placed order can be cancelled with audit trail', async () => {
  // Place a new order to test cancellation
  const freshRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Baron Von Klaus', email: 'klaus@example.com', phone: '+15559876543' },
      items: [{ menuItemId: availableDish._id, quantity: 1 }],
      orderType: 'pickup'
    })
  });
  const freshJson = await freshRes.json();
  assert.strictEqual(freshRes.status, 201);
  const cancelOrderId = freshJson.data._id;

  // Cancel order
  const cancelRes = await fetch(`${baseUrl}/api/orders/${cancelOrderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Flight departure delayed', email: 'klaus@example.com' })
  });
  const cancelJson = await cancelRes.json();
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelJson.data.status, 'cancelled');
  assert.strictEqual(cancelJson.data.cancellationReason, 'Flight departure delayed');

  // Verify cancelled order cannot be transitioned
  const retransition = await fetch(`${baseUrl}/api/orders/${cancelOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'confirmed' })
  });
  assert.strictEqual(retransition.status, 400);
});

// ============================================================================
// 6. ORDER PERSISTENCE, TRACKING & HISTORY
// ============================================================================

test('Tracking: Query single order by orderNumber', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${createdOrderNumber}`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.orderNumber, createdOrderNumber);
  assert.strictEqual(json.data.customer.email, 'guest@savoria.com');
  assert.ok(json.data.items.length >= 1);
});

test('History: Customer queries order history by email', async () => {
  const res = await fetch(`${baseUrl}/api/orders/my-orders?email=guest@savoria.com`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(json.data));
  const found = json.data.find(o => o.orderNumber === createdOrderNumber);
  assert.ok(found, 'Placed order must exist in customer order history');
});
