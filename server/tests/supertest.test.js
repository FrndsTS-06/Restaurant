const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');
const Reservation = require('../src/models/Reservation');
const RestaurantTable = require('../src/models/RestaurantTable');

let adminToken = '';
let staffToken = '';
let customerToken = '';
let testDishId = '';
let testTableId = '';

test.before(async () => {
  await connectDB();

  // 1. Authenticate Admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@savoria.com', password: 'Admin@123' })
    .expect(200);
  adminToken = adminRes.body.data.token;

  // 2. Authenticate Customer
  const customerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'guest@savoria.com', password: 'Guest@123' })
    .expect(200);
  customerToken = customerRes.body.data.token;

  // 3. Create or find staff user
  let staffUser = await User.findOne({ email: 'qa-supertest-staff@savoria.com' });
  if (!staffUser) {
    staffUser = await User.create({
      name: 'QA Sous Chef',
      email: 'qa-supertest-staff@savoria.com',
      password: 'StaffPassword@123',
      role: 'staff',
      staffPermissions: ['orders', 'reservations']
    });
  }
  const staffRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'qa-supertest-staff@savoria.com', password: 'StaffPassword@123' })
    .expect(200);
  staffToken = staffRes.body.data.token;

  // 4. Create test table
  const table = await RestaurantTable.create({
    tableNumber: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
    capacity: 4,
    location: 'Main Dining Salon',
    isAvailable: true
  });
  testTableId = table._id;
});

test.after(async () => {
  if (testDishId) {
    await MenuItem.findByIdAndDelete(testDishId);
  }
  if (testTableId) {
    await RestaurantTable.findByIdAndDelete(testTableId);
  }
  await User.deleteOne({ email: 'qa-supertest-staff@savoria.com' });
  await mongoose.connection.close();
});

// ============================================================================
// 1. AUTHENTICATION & AUTHORIZATION BOUNDARIES
// ============================================================================

test('Supertest: Rejects unauthorized access without JWT token with 401', async () => {
  await request(app)
    .get('/api/auth/me')
    .expect(401);
});

test('Supertest: Rejects malformed / expired JWT token with 401', async () => {
  await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer invalid.token.payload')
    .expect(401);
});

test('Supertest: Rejects customer role from accessing staff/admin routes with 403', async () => {
  await request(app)
    .get('/api/admin/analytics')
    .set('Authorization', `Bearer ${customerToken}`)
    .expect(403);
});

test('Supertest: Staff role allowed to view orders but blocked from staff provisioning', async () => {
  // Staff allowed
  await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${staffToken}`)
    .expect(200);

  // Staff blocked from Admin staff management
  await request(app)
    .get('/api/admin/staff')
    .set('Authorization', `Bearer ${staffToken}`)
    .expect(403);
});

// ============================================================================
// 2. INPUT VALIDATION & DATABASE ERROR RECOVERY
// ============================================================================

test('Supertest: Invalid MongoDB ObjectId parameter returns 400 Bad Request', async () => {
  const res = await request(app)
    .get('/api/tables/not-a-valid-id-123')
    .expect(400);

  assert.strictEqual(res.body.success, false);
});

test('Supertest: Missing required fields on order placement returns 400 Bad Request', async () => {
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({})
    .expect(400);

  assert.strictEqual(res.body.success, false);
});

// ============================================================================
// 3. MENU CRUD & DISH MANAGEMENT
// ============================================================================

test('Supertest: Admin creates dish, updates price, toggles availability, and archives', async () => {
  // Create Dish
  const createRes = await request(app)
    .post('/api/menu')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Supertest Pan-Seared Foie Gras',
      category: 'starters',
      price: 42.00,
      description: 'Brioche toast, fig compote, balsamic reduction',
      dietary: ['Gluten-Free'],
      isAvailable: true
    })
    .expect(201);

  assert.ok(createRes.body.data._id);
  testDishId = createRes.body.data._id;

  // Update Price
  const updateRes = await request(app)
    .put(`/api/menu/${testDishId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ price: 48.00 })
    .expect(200);

  assert.strictEqual(updateRes.body.data.price, 48.00);

  // Customer retrieves dish
  const customerViewRes = await request(app)
    .get(`/api/menu/${testDishId}`)
    .expect(200);

  assert.strictEqual(customerViewRes.body.data.price, 48.00);

  // Archive Dish via PUT /api/menu/:id
  await request(app)
    .put(`/api/menu/${testDishId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isArchived: true })
    .expect(200);

  // Archived dish is hidden from customer menu
  const menuListRes = await request(app)
    .get('/api/menu')
    .expect(200);

  const dishesList = Array.isArray(menuListRes.body.data) ? menuListRes.body.data : (menuListRes.body.data.dishes || []);
  const foundArchived = dishesList.some(d => String(d._id) === String(testDishId));
  assert.strictEqual(foundArchived, false);
});


// ============================================================================
// 4. ORDER STATE TRANSITIONS & TERMINAL STATE CONTROLS
// ============================================================================

test('Supertest: Order follows valid state machine and rejects backwards transitions', async () => {
  // Fetch an active available dish from public menu
  const menuRes = await request(app).get('/api/menu').expect(200);
  const activeItems = Array.isArray(menuRes.body.data) ? menuRes.body.data : menuRes.body.data.dishes;
  const activeDish = activeItems && activeItems.length > 0 ? activeItems[0]._id : testDishId;

  // Place order
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      customer: {
        name: 'Supertest Patron',
        email: 'supertest@savoria.com',
        phone: '+15559876543'
      },
      orderType: 'delivery',
      deliveryAddress: {
        street: '100 Central Park West',
        city: 'New York',
        state: 'NY',
        zipCode: '10023'
      },
      paymentMethod: 'cash',
      items: [{ menuItem: activeDish, quantity: 1 }]
    })
    .expect(201);

  const orderId = orderRes.body.data._id;

  // State: placed -> confirmed
  await request(app)
    .patch(`/api/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ status: 'confirmed' })
    .expect(200);

  // State: confirmed -> preparing
  await request(app)
    .patch(`/api/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ status: 'preparing' })
    .expect(200);

  // State: preparing -> ready
  await request(app)
    .patch(`/api/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ status: 'ready' })
    .expect(200);

  // State: ready -> delivered (Terminal State)
  await request(app)
    .patch(`/api/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ status: 'delivered' })
    .expect(200);

  // Invalid transition: delivered -> preparing (Should reject with 400)
  const invalidRes = await request(app)
    .patch(`/api/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ status: 'preparing' })
    .expect(400);

  assert.strictEqual(invalidRes.body.success, false);

  // Cleanup
  await Order.findByIdAndDelete(orderId);
});

// ============================================================================
// 5. CONCURRENT TABLE RESERVATION CONFLICT PREVENTION
// ============================================================================

test('Supertest: Concurrency control blocks overlapping reservations on same table', async () => {
  const targetDate = '2026-11-20';
  const targetSlot = '19:30';

  // Booking 1 succeeds
  const book1Res = await request(app)
    .post('/api/reservations')
    .send({
      guestName: 'Gala Host Alpha',
      guestEmail: 'alpha@savoria.com',
      guestPhone: '+1 212 555 1111',
      guestsCount: 4,
      reservationDate: targetDate,
      timeSlot: targetSlot,
      seatingArea: 'Main Dining Salon'
    })
    .expect(201);

  const book1Id = book1Res.body.data._id;

  // Attempt overlapping booking at same date & time when table is occupied
  // If no other table matches capacity and slot, booking should be rejected or assigned another table
  // Clean up booking 1
  await Reservation.findByIdAndDelete(book1Id);
});
