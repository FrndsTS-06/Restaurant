import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true // Do not throw on HTTP 4xx/5xx so we can assert status codes
});

let testResults = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testResults.push({ passed: true, message });
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testResults.push({ passed: false, message });
  }
}

async function runValidationAudit() {
  console.log('\n======================================================');
  console.log('   PHASE 5 — FORM VALIDATION & ERROR HANDLING AUDIT   ');
  console.log('======================================================\n');

  // 1. REGISTRATION VALIDATION
  console.log('--- 1. Testing Registration Validation ---');
  let res = await api.post('/auth/register', {});
  assert(res.status === 400, 'Empty registration returns 400');
  assert(res.data.success === false, 'Empty registration response indicates failure');

  res = await api.post('/auth/register', { name: 'A', email: 'not-an-email', password: '123' });
  assert(res.status === 400, 'Invalid email and short password (<6) returns 400');

  res = await api.post('/auth/register', {
    name: 'X'.repeat(150),
    email: 'valid@example.com',
    password: 'P'.repeat(150)
  });
  assert(res.status === 400, 'Extremely long input (>100 chars name, >128 chars password) returns 400');

  const testUserEmail = `qa_audit_${Date.now()}@savoria.com`;
  res = await api.post('/auth/register', {
    name: 'Audit User',
    email: testUserEmail,
    password: 'ValidPassword@123',
    phone: '+1 (555) 234-5678'
  });
  assert(res.status === 201 && res.data.success, 'Valid registration succeeds with 201');
  const userToken = res.data.data?.token;

  // Duplicate registration
  res = await api.post('/auth/register', {
    name: 'Audit User Duplicate',
    email: testUserEmail,
    password: 'ValidPassword@123'
  });
  assert(res.status === 400, 'Duplicate email registration rejected with 400');

  // 2. LOGIN VALIDATION
  console.log('\n--- 2. Testing Login Validation ---');
  res = await api.post('/auth/login', {});
  assert(res.status === 400, 'Empty login payload returns 400');

  res = await api.post('/auth/login', { email: 'bad-email-format', password: 'somepassword' });
  assert(res.status === 400, 'Malformed login email returns 400');

  res = await api.post('/auth/login', { email: testUserEmail, password: 'WrongPassword!' });
  assert(res.status === 401, 'Invalid credentials returns 401 Unauthorized');

  res = await api.post('/auth/login', { email: testUserEmail, password: 'ValidPassword@123' });
  assert(res.status === 200 && res.data.success, 'Correct login credentials returns 200');

  // Admin login for admin-restricted endpoints
  const adminRes = await api.post('/auth/login', { email: 'admin@savoria.com', password: 'Admin@123' });
  assert(adminRes.status === 200, 'Admin login succeeded for authenticated tests');
  const adminToken = adminRes.data?.data?.token;

  // 3. PASSWORD RESET VALIDATION
  console.log('\n--- 3. Testing Password Reset Validation ---');
  res = await api.post('/auth/forgot-password', {});
  assert(res.status === 400, 'Empty forgot password returns 400');

  res = await api.post('/auth/forgot-password', { email: 'not-an-email' });
  assert(res.status === 400, 'Malformed email in forgot password returns 400');

  res = await api.post('/auth/reset-password', {});
  assert(res.status === 400, 'Empty reset password payload returns 400');

  res = await api.post('/auth/reset-password', { token: 'invalid_token_123', newPassword: '123' });
  assert(res.status === 400, 'Short newPassword (<6 chars) rejected with 400');

  // 4. PROFILE & CHANGE PASSWORD VALIDATION
  console.log('\n--- 4. Testing Profile Updates & Security ---');
  res = await api.put('/auth/profile', { name: '' }, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(res.status === 400, 'Empty name in profile update returns 400');

  res = await api.put('/auth/profile', { phone: 'invalid-phone-format' }, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(res.status === 400, 'Invalid phone format in profile update returns 400');

  res = await api.put('/auth/change-password', { currentPassword: '', newPassword: '' }, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(res.status === 400, 'Empty change-password fields returns 400');

  res = await api.put('/auth/change-password', {
    currentPassword: 'ValidPassword@123',
    newPassword: 'ValidPassword@123'
  }, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(res.status === 400, 'New password identical to current password rejected with 400');

  // 5. CONTACT FORM VALIDATION
  console.log('\n--- 5. Testing Contact Form Validation ---');
  res = await api.post('/contact', {});
  assert(res.status === 400, 'Empty contact form returns 400');

  res = await api.post('/contact', {
    name: 'A',
    email: 'bademail',
    message: 'hi'
  });
  assert(res.status === 400, 'Contact with short name, invalid email, short message returns 400');

  res = await api.post('/contact', {
    name: 'Legitimate Guest',
    email: 'guest@domain.com',
    message: 'Valid inquiry message for private dining salon.',
    _hp_trap: 'I am a spam bot'
  });
  assert(res.status === 400, 'Honeypot trap triggers 400 and rejects spam bot');

  res = await api.post('/contact', {
    name: 'Lord Sterling',
    email: 'sterling@luxury.com',
    phone: '+1 (555) 999-0000',
    subject: 'Private Dining',
    message: 'We request a private buyout salon reservation for autumn degustation.',
    _hp_trap: '',
    _form_time: Date.now() - 5000 // 5 seconds ago
  });
  assert((res.status === 200 || res.status === 201) && res.data.success, 'Valid contact inquiry returns 200/201');

  // 6. RESERVATION VALIDATION
  console.log('\n--- 6. Testing Reservation Validation ---');
  res = await api.post('/reservations', {});
  assert(res.status === 400, 'Empty reservation returns 400');

  res = await api.post('/reservations', {
    guestName: 'J',
    guestEmail: 'notanemail',
    guestPhone: '12',
    reservationDate: '2020-01-01', // past date
    timeSlot: 'invalid_time'
  });
  assert(res.status === 400, 'Reservation with past date, bad email, bad time returns 400');

  res = await api.post('/reservations', {
    guestName: 'Julian Sterling',
    guestEmail: 'julian@savoria.com',
    guestPhone: '+1 (555) 728-1940',
    guestsCount: 50, // exceeds max 20
    reservationDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '19:00'
  });
  assert(res.status === 400, 'Party size > 20 rejected with 400');

  // 7. CHECKOUT & ORDER VALIDATION
  console.log('\n--- 7. Testing Order & Checkout Validation ---');
  res = await api.post('/orders', {});
  assert(res.status === 400, 'Empty order payload returns 400');

  res = await api.post('/orders', {
    items: [],
    orderType: 'delivery'
  });
  assert(res.status === 400, 'Order with empty items returns 400');

  res = await api.post('/orders', {
    customer: { name: 'Lady Genevieve', email: 'gen@luxury.com', phone: '+1 555-019-2834' },
    items: [{ menuItemId: '507f1f77bcf86cd799439011', name: 'Wagyu', price: -50, quantity: 1 }],
    orderType: 'delivery'
  });
  assert(res.status === 400, 'Order with negative item price returns 400');

  res = await api.post('/orders', {
    customer: { name: 'Lady Genevieve', email: 'gen@luxury.com', phone: '+1 555-019-2834' },
    items: [{ menuItemId: '507f1f77bcf86cd799439011', name: 'Wagyu', price: 120, quantity: 1 }],
    orderType: 'delivery',
    deliveryAddress: { street: '' } // missing street for delivery
  });
  assert(res.status === 400, 'Delivery order with missing street returns 400');

  // 8. MENU ITEM CREATION VALIDATION (ADMIN)
  console.log('\n--- 8. Testing Menu Item Validation (Admin) ---');
  res = await api.post('/menu', {}, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(res.status === 400, 'Empty dish payload returns 400');

  res = await api.post('/menu', {
    name: 'A',
    description: 'too short',
    price: -10,
    category: 'Mains'
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(res.status === 400, 'Dish with negative price and short name returns 400');

  // 9. CATEGORY CREATION VALIDATION (ADMIN)
  console.log('\n--- 9. Testing Category Validation (Admin) ---');
  res = await api.post('/categories', {}, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(res.status === 400, 'Empty category payload returns 400');

  res = await api.post('/categories', { name: 'A' }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(res.status === 400, 'Category with 1-character name returns 400');

  // 10. SETTINGS VALIDATION (ADMIN)
  console.log('\n--- 10. Testing Restaurant Settings Validation (Admin) ---');
  res = await api.put('/settings', {
    contactEmail: 'not-an-email',
    taxRatePercent: 150 // Invalid > 100%
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(res.status === 400, 'Settings with taxRate > 100 and bad email returns 400');

  res = await api.put('/settings', {
    bookingDurationMinutes: 10 // Invalid < 30 mins
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(res.status === 400, 'Settings with bookingDuration < 30 returns 400');

  // SUMMARY REPORT
  console.log('\n======================================================');
  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;
  console.log(`AUDIT RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runValidationAudit().catch(err => {
  console.error('Test script runner error:', err);
  process.exit(1);
});
