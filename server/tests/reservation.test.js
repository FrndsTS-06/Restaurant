const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const RestaurantTable = require('../src/models/RestaurantTable');
const Reservation = require('../src/models/Reservation');
const RestaurantSettings = require('../src/models/RestaurantSettings');

let server;
let baseUrl;
let adminToken = '';
let customerToken = '';
let testTableId = '';
let testTableNumber = '';

// Timezone-safe local YYYY-MM-DD formatter
const formatDateYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Future test date (ensure it's not a Monday, e.g., Wednesday or Tuesday)
const getFutureDate = (daysAhead = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  // If it falls on Monday (getDay() === 1), shift to Tuesday (+1)
  if (d.getDay() === 1) {
    d.setDate(d.getDate() + 1);
  }
  return formatDateYMD(d);
};

const testDate = getFutureDate(10);
const secondDate = getFutureDate(12);

test.before(async () => {
  await connectDB();

  // Ensure default settings exist with dinner active
  let settings = await RestaurantSettings.findOne();
  if (!settings) {
    settings = await RestaurantSettings.create({});
  }
  settings.operatingHours.dinner.active = true;
  settings.operatingHours.dinner.open = '17:00';
  settings.operatingHours.dinner.close = '23:00';
  settings.operatingHours.closedDays = ['Monday'];
  settings.bookingDurationMinutes = 90;
  settings.bufferTimeMinutes = 15;
  await settings.save();

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
  // Clean up test tables and reservations
  if (testTableNumber) {
    await RestaurantTable.deleteOne({ tableNumber: testTableNumber });
  }
  await Reservation.deleteMany({ guestEmail: 'qa-reservation@savoria.com' });
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
// 1. TABLE MANAGEMENT (ADMIN)
// ============================================================================

test('Table: Admin creates new dining table with capacity', async () => {
  testTableNumber = `Table VIP-${Date.now().toString().slice(-4)}`;
  const res = await fetch(`${baseUrl}/api/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      tableNumber: testTableNumber,
      capacity: 10,
      minCapacity: 6,
      location: 'Sommelier Cellar Room'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.tableNumber, testTableNumber);
  assert.strictEqual(json.data.capacity, 10);
  testTableId = json.data._id;
});

test('Table: Admin blocks a dining table when unavailable', async () => {
  const res = await fetch(`${baseUrl}/api/tables/${testTableId}/block`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      isBlocked: true,
      blockedReason: 'Private cellar maintenance'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.isBlocked, true);
  assert.strictEqual(json.data.blockedReason, 'Private cellar maintenance');
});

test('Table: Admin unblocks a dining table', async () => {
  const res = await fetch(`${baseUrl}/api/tables/${testTableId}/block`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      isBlocked: false
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.isBlocked, false);
});

// ============================================================================
// 2. AVAILABILITY CALCULATION & POLICIES
// ============================================================================

test('Availability: Query live available slots for party size', async () => {
  const res = await fetch(`${baseUrl}/api/reservations/availability?date=${testDate}&guestsCount=4`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.date, testDate);
  assert.strictEqual(json.data.guestsCount, 4);
  assert.ok(Array.isArray(json.data.slots));
  assert.ok(json.data.slots.length >= 6);
  assert.ok(json.data.isAvailable, 'Should have available dinner slots');
});

test('Availability: Rejects reservations on past dates', async () => {
  const res = await fetch(`${baseUrl}/api/reservations/availability?date=2020-01-01&guestsCount=2`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.isAvailable, false);
  assert.ok(json.data.message.includes('past'));
});

test('Availability: Detects closed restaurant days (Monday)', async () => {
  // Find next Monday
  const d = new Date();
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1);
  }
  const nextMonday = formatDateYMD(d);

  const res = await fetch(`${baseUrl}/api/reservations/availability?date=${nextMonday}&guestsCount=2`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.isAvailable, false);
  assert.ok(json.data.message.includes('closed on Monday'));
});

// ============================================================================
// 3. TABLE BOOKING, CONFLICT REJECTION & PERSISTENCE
// ============================================================================

let createdReservationId = '';
let createdReservationNumber = '';

test('Booking: Books a table reservation and assigns eligible table', async () => {
  const res = await fetch(`${baseUrl}/api/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      guestName: 'Baroness Charlotte',
      guestEmail: 'qa-reservation@savoria.com',
      guestPhone: '+1 (555) 302-8491',
      guestsCount: 10,
      tableNumber: testTableNumber,
      reservationDate: testDate,
      timeSlot: '19:00',
      seatingArea: 'Sommelier Cellar Room',
      specialRequests: 'Dom Pérignon 2008 on ice upon arrival'
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.status, 'confirmed');
  assert.strictEqual(json.data.reservationDate, testDate);
  assert.strictEqual(json.data.timeSlot, '19:00');
  assert.strictEqual(json.data.endTimeSlot, '20:30'); // 90 min duration
  assert.ok(json.data.reservationNumber.startsWith('RES-'));
  assert.ok(json.data.table, 'Must have allocated table reference');

  createdReservationId = json.data._id;
  createdReservationNumber = json.data.reservationNumber;
});

test('Booking Persistence: Verifies reservation persists in MongoDB and retrieved by code', async () => {
  const res = await fetch(`${baseUrl}/api/reservations?search=${createdReservationNumber}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(json.data.length >= 1);
  assert.strictEqual(json.data[0].guestName, 'Baroness Charlotte');
  assert.strictEqual(json.data[0].reservationNumber, createdReservationNumber);
});

test('Conflict Prevention: Rejects overlapping booking when all matching capacity tables are occupied', async () => {
  // Table VIP is booked from 19:00 to 20:30. Attempting another booking for the same table at 19:30 conflicts!
  const res = await fetch(`${baseUrl}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guestName: 'Conflicting Party',
      guestEmail: 'conflict@example.com',
      guestPhone: '+1 (555) 999-1122',
      guestsCount: 10,
      tableNumber: testTableNumber,
      reservationDate: testDate,
      timeSlot: '19:30', // Overlaps with 19:00-20:30 (+ 15 min buffer)
      seatingArea: 'Sommelier Cellar Room'
    })
  });
  const json = await res.json();
  // Must be rejected with 400 because table is already occupied for overlapping slot
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('No tables with sufficient capacity') || json.message.includes('No available dining table'));
});

// ============================================================================
// 4. CUSTOMER HISTORY & CANCELLATION FLOW
// ============================================================================

test('History: Customer retrieves their booking history', async () => {
  const res = await fetch(`${baseUrl}/api/reservations/my-reservations?email=qa-reservation@savoria.com`);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.data));
  const found = json.data.find(r => r.reservationNumber === createdReservationNumber);
  assert.ok(found, 'Created reservation must appear in customer history');
});

test('Cancellation: Customer cancels eligible reservation and frees the table', async () => {
  const cancelRes = await fetch(`${baseUrl}/api/reservations/${createdReservationId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Trip rescheduled to Paris', guestEmail: 'qa-reservation@savoria.com' })
  });
  const cancelJson = await cancelRes.json();
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelJson.success, true);
  assert.strictEqual(cancelJson.data.status, 'cancelled');
  assert.strictEqual(cancelJson.data.cancellationReason, 'Trip rescheduled to Paris');

  // Verify availability is recalculated: 19:00 slot should now be available again for party of 8!
  const availRes = await fetch(`${baseUrl}/api/reservations/availability?date=${testDate}&guestsCount=8`);
  const availJson = await availRes.json();
  assert.strictEqual(availRes.status, 200);
  const slot19 = availJson.data.slots.find(s => s.time === '19:00');
  assert.ok(slot19);
  assert.strictEqual(slot19.available, true, 'Slot must be freed up after reservation cancellation');
});

test('Cancellation: Rejects cancelling already cancelled reservation', async () => {
  const res = await fetch(`${baseUrl}/api/reservations/${createdReservationId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Try cancelling again', guestEmail: 'qa-reservation@savoria.com' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('already cancelled'));
});

// ============================================================================
// 5. ADMIN CONCIERGE STATUS UPDATES & SETTINGS
// ============================================================================

test('Admin: Updates reservation status and seats guest', async () => {
  // Create a new booking on secondDate
  const bookRes = await fetch(`${baseUrl}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guestName: 'Viscount Sterling',
      guestEmail: 'qa-reservation@savoria.com',
      guestPhone: '+1 (555) 444-2200',
      guestsCount: 4,
      reservationDate: secondDate,
      timeSlot: '18:00'
    })
  });
  const bookJson = await bookRes.json();
  assert.strictEqual(bookRes.status, 201);
  const resId = bookJson.data._id;

  // Admin updates status to 'seated'
  const updateRes = await fetch(`${baseUrl}/api/reservations/${resId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'seated' })
  });
  const updateJson = await updateRes.json();
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateJson.data.status, 'seated');
});

test('Settings: Admin configures operating hours and booking duration', async () => {
  const res = await fetch(`${baseUrl}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      bookingDurationMinutes: 120, // 2 hours
      bufferTimeMinutes: 20
    })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.bookingDurationMinutes, 120);
  assert.strictEqual(json.data.bufferTimeMinutes, 20);
});
