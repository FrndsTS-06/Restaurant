const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Reservation = require('../src/models/Reservation');
const Payment = require('../src/models/Payment');

let server;
let baseUrl;
let adminToken = '';
let customerToken = '';
let customerId = '';
let createdStaffId = '';
let testPaymentId = '';

test.before(async () => {
  await connectDB();

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
  // Clean up any test users/payments created
  if (createdStaffId) {
    await User.findByIdAndDelete(createdStaffId);
  }
  await User.deleteOne({ email: 'qa-staff@savoria.com' });
  if (server) server.close();
  await mongoose.connection.close();
});

// ============================================================================
// 1. SETUP & AUTHENTICATION
// ============================================================================

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
  customerId = customerJson.data.user.id;
});

// ============================================================================
// 2. ROLE-BASED ACCESS CONTROL (RBAC) - REJECTION OF UNAUTHORIZED CUSTOMER
// ============================================================================

test('RBAC: Rejects unauthenticated request without token to /api/admin/analytics with 401', async () => {
  const res = await fetch(`${baseUrl}/api/admin/analytics`);
  assert.strictEqual(res.status, 401);
  const json = await res.json();
  assert.strictEqual(json.success, false);
});

test('RBAC: Customer token rejected from /api/admin/analytics with 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
  const json = await res.json();
  assert.strictEqual(json.success, false);
});

test('RBAC: Customer token rejected from /api/admin/customers with 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/admin/customers`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

test('RBAC: Customer token rejected from /api/admin/staff with 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/admin/staff`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

test('RBAC: Customer token rejected from /api/admin/payments with 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/admin/payments`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

test('RBAC: Customer token rejected from /api/admin/reports/sales with 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/admin/reports/sales`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

// ============================================================================
// 3. DASHBOARD ANALYTICS & STATISTICAL ACCURACY
// ============================================================================

test('Analytics: Admin retrieves real-time dashboard analytics matching database state', async () => {
  const res = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);

  const data = json.data;
  assert.ok(data !== null && typeof data === 'object');

  // Verify total orders matches actual count in MongoDB
  const dbOrdersCount = await Order.countDocuments({});
  assert.strictEqual(data.totalOrders, dbOrdersCount, 'totalOrders must match actual DB count');

  // Verify pending orders matches actual DB count
  const dbPendingCount = await Order.countDocuments({
    status: { $in: ['placed', 'confirmed', 'preparing'] }
  });
  assert.strictEqual(data.pendingOrders, dbPendingCount);

  // Verify active reservations count
  assert.ok(typeof data.activeReservations === 'number');

  // Verify popular dishes array structure
  assert.ok(Array.isArray(data.popularDishes));

  // Verify recent orders array structure
  assert.ok(Array.isArray(data.recentOrders));
  assert.ok(data.recentOrders.length <= 6);

  // Verify sales chart array structure
  assert.ok(Array.isArray(data.salesChart));

  // Verify order status distribution object
  assert.ok(typeof data.orderStatusDistribution === 'object');
  assert.ok('placed' in data.orderStatusDistribution);
  assert.ok('completed' in data.orderStatusDistribution);
});

// ============================================================================
// 4. CUSTOMER MANAGEMENT
// ============================================================================

test('Customers: Admin retrieves paginated customer list with spending metrics', async () => {
  const res = await fetch(`${baseUrl}/api/admin/customers?page=1&limit=10`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 1);
  assert.ok(json.pagination);
  assert.ok(json.pagination.total >= 1);

  const customer = json.data[0];
  assert.ok(customer);
  assert.ok('ordersCount' in customer);
  assert.ok('totalSpent' in customer);
});

test('Customers: Admin searches customer records by query', async () => {
  const res = await fetch(`${baseUrl}/api/admin/customers?search=guest@savoria.com`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.length, 1);
  assert.strictEqual(json.data[0].email, 'guest@savoria.com');
});

test('Customers: Admin retrieves customer dossier with order & reservation history', async () => {
  const res = await fetch(`${baseUrl}/api/admin/customers/${customerId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(json.data.customer);
  assert.ok(Array.isArray(json.data.orders));
  assert.ok(Array.isArray(json.data.reservations));
});

test('Customers: Admin updates customer status and notes', async () => {
  const res = await fetch(`${baseUrl}/api/admin/customers/${customerId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      isActive: true,
      notes: 'VIP Patron - Preference for Burgundy wines'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.notes, 'VIP Patron - Preference for Burgundy wines');
});

// ============================================================================
// 5. STAFF PERSONNEL MANAGEMENT
// ============================================================================

test('Staff: Admin provisions new staff member with modular permissions', async () => {
  const res = await fetch(`${baseUrl}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Chef Antoine Dumas',
      email: 'qa-staff@savoria.com',
      password: 'StaffPassword@123',
      role: 'chef',
      permissions: ['menu', 'orders'],
      phone: '+1 (555) 778-9900'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.email, 'qa-staff@savoria.com');
  assert.strictEqual(json.data.role, 'chef');
  assert.deepStrictEqual(json.data.permissions, ['menu', 'orders']);
  assert.strictEqual(json.data.password, undefined, 'Password must never be returned');

  createdStaffId = json.data._id;
});

test('Staff: Admin updates staff permissions and role', async () => {
  const res = await fetch(`${baseUrl}/api/admin/staff/${createdStaffId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      role: 'staff',
      permissions: ['orders', 'reservations', 'reports']
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.role, 'staff');
  assert.deepStrictEqual(json.data.permissions, ['orders', 'reservations', 'reports']);
});

test('Staff: Admin deletes provisioned staff account', async () => {
  const res = await fetch(`${baseUrl}/api/admin/staff/${createdStaffId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);

  // Confirm deleted from MongoDB
  const found = await User.findById(createdStaffId);
  assert.strictEqual(found, null);
  createdStaffId = '';
});

// ============================================================================
// 6. PAYMENTS LEDGER & REFUNDS
// ============================================================================

test('Payments: Admin retrieves transaction records ledger with summary KPIs', async () => {
  const res = await fetch(`${baseUrl}/api/admin/payments?page=1&limit=10`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data.payments));
  assert.ok(json.data.summary);
  assert.ok(typeof json.data.summary.totalVolume === 'number');

  if (json.data.payments.length > 0) {
    testPaymentId = json.data.payments[0]._id;
  }
});

test('Payments: Admin executes verified refund on eligible payment', async () => {
  // Create a dedicated fresh successful payment to refund
  const sampleOrder = await Order.findOne({});
  const freshPayment = await Payment.create({
    order: sampleOrder._id,
    amount: 55.00,
    currency: 'USD',
    paymentMethod: 'card',
    status: 'successful'
  });

  const res = await fetch(`${baseUrl}/api/admin/payments/${freshPayment._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ reason: 'QA Audit Test Refund' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.status, 'refunded');
  assert.strictEqual(json.data.refundDetails.reason, 'QA Audit Test Refund');

  // Clean up
  await Payment.findByIdAndDelete(freshPayment._id);
});

// ============================================================================
// 7. BUSINESS REPORTS EXPORT (JSON & RFC 4180 CSV)
// ============================================================================

test('Reports: Generates JSON sales report', async () => {
  const res = await fetch(`${baseUrl}/api/admin/reports/sales?format=json`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(json.data));
});

test('Reports: Generates RFC 4180 CSV sales report with text/csv headers', async () => {
  const res = await fetch(`${baseUrl}/api/admin/reports/sales?format=csv`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers.get('content-type').includes('text/csv'));
  const csv = await res.text();
  assert.ok(csv.startsWith('Date,Orders,Subtotal,Tax,Delivery Fee,Discount,Total Revenue'));
});

test('Reports: Generates RFC 4180 CSV orders report', async () => {
  const res = await fetch(`${baseUrl}/api/admin/reports/orders?format=csv`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  const csv = await res.text();
  assert.ok(csv.startsWith('Order Number,Date,Customer Name,Email,Phone,Order Type,Status,Payment Status,Items Count,Total Amount'));
});

test('Reports: Generates RFC 4180 CSV reservations report', async () => {
  const res = await fetch(`${baseUrl}/api/admin/reports/reservations?format=csv`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  const csv = await res.text();
  assert.ok(csv.startsWith('Reservation Number,Date,Time Slot,Guest Name,Email,Phone,Guests Count,Table,Status,Special Requests'));
});

test('Reports: Generates RFC 4180 CSV dishes performance report', async () => {
  const res = await fetch(`${baseUrl}/api/admin/reports/dishes?format=csv`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  const csv = await res.text();
  assert.ok(csv.startsWith('Dish Name,Category,Price,Cost Price,Unit Margin,Available,Rating,Total Sold,Total Revenue'));
});
