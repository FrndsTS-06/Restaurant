const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let server;
let baseUrl;
let adminToken = '';
let customerToken = '';
let sampleMenuItemId = '';
let sampleOrderId = '';
let sampleOrderNumber = '';

test.before(async () => {
  // Ensure MongoDB is connected before running tests
  await connectDB();
  const Reservation = require('../src/models/Reservation');
  await Reservation.deleteMany({ guestEmail: 'catherine@example.com' });

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
  if (server) {
    server.close();
  }
  const Reservation = require('../src/models/Reservation');
  await Reservation.deleteMany({ guestEmail: 'catherine@example.com' });
  // Gracefully close mongoose connection
  await mongoose.connection.close();
});

// ==========================================
// 1. HEALTH & CONNECTIVITY TESTS
// ==========================================
test('GET /api/health should return ok status and database connectivity', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.database.status, 'connected');
  assert.strictEqual(data.database.readyState, 1);
});

// ==========================================
// 2. AUTHENTICATION & SECURITY TESTS
// ==========================================
test('POST /api/auth/login should authenticate seeded admin user', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.token, 'Must return JWT token');
  assert.strictEqual(json.data.user.role, 'admin');
  adminToken = json.data.token;
});

test('POST /api/auth/login should authenticate seeded customer user', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.token, 'Must return JWT token');
  assert.strictEqual(json.data.user.role, 'customer');
  customerToken = json.data.token;
});

test('POST /api/auth/login with wrong credentials should reject with 401', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'WrongPassword' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(json.success, false);
});

test('POST /api/auth/register duplicate email should return 400 error', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Admin',
      email: 'admin@savoria.com',
      password: 'SomePassword123'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

// ==========================================
// 3. CATEGORIES ENDPOINTS
// ==========================================
test('GET /api/categories should return active culinary categories', async () => {
  const res = await fetch(`${baseUrl}/api/categories`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 4, 'Should have at least 4 seeded categories');
});

test('GET /api/categories/:identifier should return category by slug', async () => {
  const res = await fetch(`${baseUrl}/api/categories/mains`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.slug, 'mains');
});

test('POST /api/categories should reject unauthorized requests without token', async () => {
  const res = await fetch(`${baseUrl}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized Category' })
  });
  assert.strictEqual(res.status, 401);
});

// ==========================================
// 4. MENU ITEMS & SEARCH / FILTER / PAGINATION
// ==========================================
test('GET /api/menu should return paginated culinary menu items', async () => {
  const res = await fetch(`${baseUrl}/api/menu`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 9, 'Should have at least 9 seeded dishes');
  assert.ok(json.pagination);
  assert.ok(json.pagination.totalItems >= 9);

  // Store Wagyu dish ID for subsequent tests
  const wagyuDish = json.data.find(d => d.name.toLowerCase().includes('wagyu')) || json.data[0];
  sampleMenuItemId = wagyuDish._id;
});

test('GET /api/menu with search filter should find matching dishes', async () => {
  const res = await fetch(`${baseUrl}/api/menu?search=Wagyu`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.length >= 1);
  assert.ok(json.data[0].name.toLowerCase().includes('wagyu'));
});

test('GET /api/menu with category and dietary filter', async () => {
  const res = await fetch(`${baseUrl}/api/menu?category=mains&dietary=gluten-free`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  json.data.forEach(item => {
    assert.strictEqual(item.dietary.includes('gluten-free'), true);
  });
});

test('GET /api/menu with pagination limit=3 should return exactly 3 items', async () => {
  const res = await fetch(`${baseUrl}/api/menu?page=1&limit=3`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.length, 3);
  assert.strictEqual(json.pagination.currentPage, 1);
  assert.strictEqual(json.pagination.limit, 3);
  assert.strictEqual(json.pagination.hasMore, true);
});

test('GET /api/menu/:id should return single dish details', async () => {
  const res = await fetch(`${baseUrl}/api/menu/${sampleMenuItemId}`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data._id, sampleMenuItemId);
});

test('GET /api/menu/:id with nonexistent ID should return 404', async () => {
  const res = await fetch(`${baseUrl}/api/menu/000000000000000000000000`);
  const json = await res.json();
  assert.strictEqual(res.status, 404);
  assert.strictEqual(json.success, false);
});

// ==========================================
// 5. RESTAURANT SETTINGS & TABLES
// ==========================================
test('GET /api/settings should return restaurant business config', async () => {
  const res = await fetch(`${baseUrl}/api/settings`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.restaurantName, 'SAVORIA Haute Cuisine');
  assert.strictEqual(json.data.currency, 'INR');
});

test('GET /api/tables should return dining tables list', async () => {
  const res = await fetch(`${baseUrl}/api/tables`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 6);
});

test('GET /api/tables/:id with invalid ObjectId should return 400', async () => {
  const res = await fetch(`${baseUrl}/api/tables/not-a-valid-object-id`);
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

// ==========================================
// 6. PERSISTENT CART OPERATIONS
// ==========================================
const testSessionId = `test_sess_${Date.now()}`;
let cartItemId = '';

test('GET /api/cart should retrieve or initialize cart for session', async () => {
  const res = await fetch(`${baseUrl}/api/cart?sessionId=${testSessionId}`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.sessionId, testSessionId);
  assert.strictEqual(json.data.items.length, 0);
});

test('POST /api/cart/items should add culinary item to persistent cart', async () => {
  const res = await fetch(`${baseUrl}/api/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      menuItemId: sampleMenuItemId,
      quantity: 2,
      specialInstructions: 'Extra truffle shavings please'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.items.length, 1);
  assert.strictEqual(json.data.items[0].quantity, 2);
  assert.ok(json.data.subtotal > 0);
  cartItemId = json.data.items[0]._id;
});

test('PUT /api/cart/items/:itemId should update quantity in cart', async () => {
  const res = await fetch(`${baseUrl}/api/cart/items/${cartItemId}?sessionId=${testSessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quantity: 3
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.items[0].quantity, 3);
});

test('POST /api/cart/apply-coupon should apply valid discount coupon', async () => {
  const res = await fetch(`${baseUrl}/api/cart/apply-coupon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      code: 'SAVORIA10'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.couponCode, 'SAVORIA10');
  assert.ok(json.data.discount > 0);
});

test('DELETE /api/cart should clear persistent cart', async () => {
  const res = await fetch(`${baseUrl}/api/cart?sessionId=${testSessionId}`, {
    method: 'DELETE'
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.items.length, 0);
  assert.strictEqual(json.data.subtotal, 0);
});

// ==========================================
// 7. COUPON VALIDATION
// ==========================================
test('POST /api/coupons/validate with valid code should calculate discount', async () => {
  const res = await fetch(`${baseUrl}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'SAVORIA10',
      orderAmount: 100
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.code, 'SAVORIA10');
  assert.strictEqual(json.data.discountAmount, 10);
});

test('POST /api/coupons/validate with invalid code should reject', async () => {
  const res = await fetch(`${baseUrl}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'INVALID_COUPON_XYZ',
      orderAmount: 100
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 404);
  assert.strictEqual(json.success, false);
});

// ==========================================
// 8. ORDERS & PAYMENTS & RELATIONSHIPS
// ==========================================
test('POST /api/payments/create-order should return payment order payload', async () => {
  const res = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 68.00 })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.orderId);
  assert.strictEqual(json.data.amount, 6800);
});

test('POST /api/payments/verify should verify test signature', async () => {
  const res = await fetch(`${baseUrl}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpayOrderId: 'order_test_123',
      razorpayPaymentId: 'pay_test_456',
      razorpaySignature: 'test_verified_signature'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.verified, true);
});

test('POST /api/orders should accept and persist food order with payment relation', async () => {
  const newOrder = {
    customer: { name: 'Julian Sterling', email: 'julian@example.com', phone: '+15557281940' },
    items: [{ menuItem: sampleMenuItemId, name: 'A5 Miyazaki Wagyu Ribeye', price: 68.00, quantity: 2 }],
    orderType: 'dine-in',
    tableNumber: 'Table 7'
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.totalAmount, 147.22); // 136 + 8.25% tax = 147.22
  assert.ok(json.data.orderNumber.startsWith('SAV-'));
  assert.ok(json.data.payment, 'Must have associated payment reference');

  sampleOrderId = json.data._id;
  sampleOrderNumber = json.data.orderNumber;
});

test('GET /api/orders/:id should fetch order by orderNumber', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${sampleOrderNumber}`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.orderNumber, sampleOrderNumber);
  assert.strictEqual(json.data.customer.name, 'Julian Sterling');
});

test('GET /api/orders/my-orders should retrieve orders by customer email', async () => {
  const res = await fetch(`${baseUrl}/api/orders/my-orders?email=julian@example.com`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 1);
});

test('PATCH /api/orders/:id/status should update status and create audit log', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${sampleOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'confirmed',
      note: 'Order confirmed by maître d'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.status, 'confirmed');
  assert.strictEqual(json.data.statusHistory.length, 2);
});

// ==========================================
// 9. TABLE RESERVATIONS
// ==========================================
test('POST /api/reservations should accept and store new table booking', async () => {
  const booking = {
    guestName: 'Lady Catherine',
    guestEmail: 'catherine@example.com',
    guestPhone: '+1 (555) 345-6789',
    guestsCount: 4,
    reservationDate: '2026-10-25',
    timeSlot: '20:00',
    specialRequests: 'Window table facing gardens'
  };

  const res = await fetch(`${baseUrl}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.guestName, 'Lady Catherine');
});

test('GET /api/reservations should return bookings for admin', async () => {
  const res = await fetch(`${baseUrl}/api/reservations`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 1);
});

// ==========================================
// 10. REVIEWS & AUDIT LOGS
// ==========================================
test('GET /api/reviews/dish/:dishId should retrieve dish reviews', async () => {
  const res = await fetch(`${baseUrl}/api/reviews/dish/${sampleMenuItemId}`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
});

test('GET /api/audit-logs should return audit trail for admin', async () => {
  const res = await fetch(`${baseUrl}/api/audit-logs`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 1, 'Should have at least 1 audit log entry');
});
