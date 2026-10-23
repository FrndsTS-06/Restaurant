import axios from 'axios';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true // Do not throw on 4xx/5xx so we can assert exact status codes
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

async function runAuthAndPermissionAudit() {
  console.log('\n======================================================');
  console.log('   PHASE 6 — AUTHENTICATION & AUTHORIZATION AUDIT    ');
  console.log('======================================================\n');

  // 1. CUSTOMER REGISTRATION & ROLE TAMPERING PREVENTION
  console.log('--- 1. Customer Registration & Role Tampering ---');
  const uniqueId = Date.now();
  const customerEmail = `patron_${uniqueId}@savoria.com`;
  const customerPassword = 'PatronPassword@123';

  // Attempt role escalation by supplying role: 'admin' during registration
  let regRes = await api.post('/auth/register', {
    name: 'Patron Julian',
    email: customerEmail,
    password: customerPassword,
    phone: '+1 (555) 789-0123',
    role: 'admin' // Malicious attempt to self-assign admin
  });

  assert(regRes.status === 201, 'Registration returns HTTP 201 Created');
  assert(regRes.data.success === true, 'Registration response indicates success');
  assert(regRes.data.data.user.role === 'customer', 'MANDATORY: Self-assigned role "admin" is rejected and forced to "customer"');
  assert(!regRes.data.data.user.password, 'User password hash is not exposed in registration response');
  assert(Boolean(regRes.data.data.token), 'Access token is issued in registration response');

  const customerToken = regRes.data.data.token;
  const customerRefreshToken = regRes.data.data.refreshToken;
  const customerId = regRes.data.data.user.id;

  // Duplicate email registration prevention
  let dupRes = await api.post('/auth/register', {
    name: 'Duplicate Patron',
    email: customerEmail,
    password: customerPassword
  });
  assert(dupRes.status === 400, 'Duplicate email registration rejected with 400');

  // 2. LOGIN WITH VALID CREDENTIALS
  console.log('\n--- 2. Login With Valid Credentials ---');
  let loginRes = await api.post('/auth/login', {
    email: customerEmail,
    password: customerPassword
  });
  assert(loginRes.status === 200, 'Valid login returns HTTP 200');
  assert(loginRes.data.data.user.role === 'customer', 'Logged in user has customer role');
  assert(!loginRes.data.data.user.password, 'Password hash is not leaked in login response');
  assert(!loginRes.data.data.user.refreshTokens, 'Internal refresh tokens array is not exposed in user object');

  // Check Set-Cookie headers for HttpOnly cookie security
  const cookies = loginRes.headers['set-cookie'];
  if (cookies) {
    const hasHttpOnly = cookies.some(c => c.toLowerCase().includes('httponly'));
    assert(hasHttpOnly, 'Authentication cookies specify HttpOnly protection flag');
  } else {
    console.log('  ℹ Note: Client running in Bearer token mode');
  }

  // 3. LOGIN WITH INCORRECT CREDENTIALS (USER ENUMERATION PREVENTION)
  console.log('\n--- 3. Login With Incorrect Credentials ---');
  let badPassRes = await api.post('/auth/login', {
    email: customerEmail,
    password: 'WrongPassword@999'
  });
  assert(badPassRes.status === 401, 'Wrong password returns HTTP 401 Unauthorized');
  assert(badPassRes.data.message.toLowerCase().includes('invalid'), 'Returns generic "invalid email or password" error');

  let badEmailRes = await api.post('/auth/login', {
    email: `non_existent_${uniqueId}@savoria.com`,
    password: 'AnyPassword@123'
  });
  assert(badEmailRes.status === 401, 'Non-existent email returns HTTP 401 Unauthorized');
  assert(badEmailRes.data.message === badPassRes.data.message, 'Identical error message returned for wrong password and non-existent email (prevents enumeration)');

  // 4. LOGOUT & SESSION TERMINATION
  console.log('\n--- 4. Logout & Session Termination ---');
  let logoutRes = await api.post('/auth/logout', {
    refreshToken: customerRefreshToken
  });
  assert(logoutRes.status === 200, 'Logout returns HTTP 200');

  // 5. SESSION PERSISTENCE & TOKEN AUTHENTICATION
  console.log('\n--- 5. Session Persistence & Profile Authentication ---');
  let profileRes = await api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert(profileRes.status === 200, 'Valid Bearer token accesses /api/auth/profile');
  assert(profileRes.data.data.email === customerEmail, 'Retrieved profile belongs to authenticated customer');

  // 6. EXPIRED & INVALID SESSIONS
  console.log('\n--- 6. Expired & Invalid Sessions Handling ---');
  let tamperedTokenRes = await api.get('/auth/profile', {
    headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload' }
  });
  assert(tamperedTokenRes.status === 401, 'Tampered JWT token rejected with HTTP 401');

  // Expired token simulation
  const expiredSecret = 'restaurantpro_secure_jwt_secret_key_2026_dev_auth';
  const simulatedExpiredToken = jwt.sign(
    { id: customerId, role: 'customer' },
    expiredSecret,
    { expiresIn: '-1s' }
  );
  let expiredTokenRes = await api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${simulatedExpiredToken}` }
  });
  assert(expiredTokenRes.status === 401, 'Expired access token rejected with HTTP 401');
  assert(expiredTokenRes.data.message.toLowerCase().includes('expired'), 'Explicit message indicating token expiration returned');

  // 7. PASSWORD RESET FLOW
  console.log('\n--- 7. Password Reset Flow ---');
  // Neutral response for unknown email
  let forgotUnknownRes = await api.post('/auth/forgot-password', {
    email: `unknown_${uniqueId}@savoria.com`
  });
  assert(forgotUnknownRes.status === 200, 'Forgot password for non-existent email returns HTTP 200 (no harvesting)');

  // Known email reset token generation
  let forgotKnownRes = await api.post('/auth/forgot-password', {
    email: customerEmail
  });
  assert(forgotKnownRes.status === 200, 'Forgot password for registered email returns HTTP 200');
  const resetToken = forgotKnownRes.data.data?.resetToken;
  assert(Boolean(resetToken), 'One-time crypto reset token returned in dev/sandbox mode');

  // Reset password with token
  const newPassword = 'NewSecretPassword@456';
  let resetRes = await api.post('/auth/reset-password', {
    token: resetToken,
    newPassword
  });
  assert(resetRes.status === 200, 'Password reset with valid token succeeds with HTTP 200');

  // Verify login with new password
  let loginWithNewPassRes = await api.post('/auth/login', {
    email: customerEmail,
    password: newPassword
  });
  assert(loginWithNewPassRes.status === 200, 'Login succeeds with newly set password');
  const updatedCustomerToken = loginWithNewPassRes.data.data.token;

  // Verify old password no longer works
  let oldPassLoginRes = await api.post('/auth/login', {
    email: customerEmail,
    password: customerPassword
  });
  assert(oldPassLoginRes.status === 401, 'Old password is invalidated and rejected');

  // 8. PROTECTED CUSTOMER ROUTES (UNAUTHENTICATED ACCESS BLOCKED)
  console.log('\n--- 8. Protected Customer Routes (Unauthenticated Blocked) ---');
  let noAuthProfile = await api.get('/auth/profile');
  assert(noAuthProfile.status === 401, 'Unauthenticated GET /api/auth/profile rejected with 401');

  let noAuthChangePass = await api.put('/auth/change-password', {
    currentPassword: newPassword,
    newPassword: 'AnotherPassword@789'
  });
  assert(noAuthChangePass.status === 401, 'Unauthenticated PUT /api/auth/change-password rejected with 401');

  // Authenticate as Staff and Admin for RBAC testing
  console.log('\n--- Authenticating Staff & Admin Accounts for RBAC Tests ---');
  const adminLogin = await api.post('/auth/login', {
    email: 'admin@savoria.com',
    password: 'Admin@123'
  });
  assert(adminLogin.status === 200, 'Admin login succeeded');
  const adminToken = adminLogin.data.data.token;

  const staffLogin = await api.post('/auth/login', {
    email: 'staff@savoria.com',
    password: 'Staff@123'
  });
  assert(staffLogin.status === 200, 'Staff login succeeded');
  const staffToken = staffLogin.data.data.token;

  // 9. PROTECTED ADMIN ROUTES (UNAUTHENTICATED ACCESS BLOCKED)
  console.log('\n--- 9. Protected Admin Routes (Unauthenticated Blocked) ---');
  assert((await api.get('/admin/analytics')).status === 401, 'Unauthenticated GET /api/admin/analytics returns 401');
  assert((await api.get('/admin/customers')).status === 401, 'Unauthenticated GET /api/admin/customers returns 401');
  assert((await api.get('/admin/staff')).status === 401, 'Unauthenticated GET /api/admin/staff returns 401');
  assert((await api.get('/coupons')).status === 401, 'Unauthenticated GET /api/coupons returns 401');
  assert((await api.get('/audit-logs')).status === 401, 'Unauthenticated GET /api/audit-logs returns 401');

  // 10. CUSTOMER ATTEMPTING TO ACCESS ADMIN APIS (FORBIDDEN 403)
  console.log('\n--- 10. Customer Attempting to Access Admin APIs (403 Forbidden) ---');
  const custHeader = { headers: { Authorization: `Bearer ${updatedCustomerToken}` } };

  let custAnalytics = await api.get('/admin/analytics', custHeader);
  assert(custAnalytics.status === 403, 'Customer GET /api/admin/analytics rejected with 403 Forbidden');

  let custCustomers = await api.get('/admin/customers', custHeader);
  assert(custCustomers.status === 403, 'Customer GET /api/admin/customers rejected with 403 Forbidden');

  let custStaff = await api.get('/admin/staff', custHeader);
  assert(custStaff.status === 403, 'Customer GET /api/admin/staff rejected with 403 Forbidden');

  let custCreateMenu = await api.post('/menu', { name: 'Unauthorized Dish', price: 50 }, custHeader);
  assert(custCreateMenu.status === 403, 'Customer POST /api/menu rejected with 403 Forbidden');

  let custCreateCategory = await api.post('/categories', { name: 'Unauthorized Cat' }, custHeader);
  assert(custCreateCategory.status === 403, 'Customer POST /api/categories rejected with 403 Forbidden');

  let custCreateTable = await api.post('/tables', { tableNumber: 'T99', capacity: 4 }, custHeader);
  assert(custCreateTable.status === 403, 'Customer POST /api/tables rejected with 403 Forbidden');

  let custCoupons = await api.get('/coupons', custHeader);
  assert(custCoupons.status === 403, 'Customer GET /api/coupons rejected with 403 Forbidden');

  let custSettings = await api.put('/settings', { restaurantName: 'Hacked' }, custHeader);
  assert(custSettings.status === 403, 'Customer PUT /api/settings rejected with 403 Forbidden');

  let custAuditLogs = await api.get('/audit-logs', custHeader);
  assert(custAuditLogs.status === 403, 'Customer GET /api/audit-logs rejected with 403 Forbidden');

  // 11. STAFF ATTEMPTING UNAUTHORIZED ACTIONS (FORBIDDEN 403)
  console.log('\n--- 11. Staff Attempting Unauthorized Actions (403 Forbidden) ---');
  const staffHeader = { headers: { Authorization: `Bearer ${staffToken}` } };

  // Staff is allowed order & reservation operational management
  let staffOrders = await api.get('/orders', staffHeader);
  assert(staffOrders.status === 200, 'Staff GET /api/orders succeeds (Permitted operational view)');

  let staffReservations = await api.get('/reservations', staffHeader);
  assert(staffReservations.status === 200, 'Staff GET /api/reservations succeeds (Permitted operational view)');

  // Staff is forbidden from Admin-only functions
  let staffAnalytics = await api.get('/admin/analytics', staffHeader);
  assert(staffAnalytics.status === 403, 'Staff GET /api/admin/analytics rejected with 403 Forbidden');

  let staffStaffList = await api.get('/admin/staff', staffHeader);
  assert(staffStaffList.status === 403, 'Staff GET /api/admin/staff rejected with 403 Forbidden');

  let staffCustomers = await api.get('/admin/customers', staffHeader);
  assert(staffCustomers.status === 403, 'Staff GET /api/admin/customers rejected with 403 Forbidden');

  let staffDeleteDish = await api.delete('/menu/507f1f77bcf86cd799439011', staffHeader);
  assert(staffDeleteDish.status === 403, 'Staff DELETE /api/menu/:id rejected with 403 Forbidden');

  let staffCreateCoupon = await api.post('/coupons', { code: 'STAFFDISCOUNT', discountPercent: 50 }, staffHeader);
  assert(staffCreateCoupon.status === 403, 'Staff POST /api/coupons rejected with 403 Forbidden');

  let staffSettings = await api.put('/settings', { taxRatePercent: 0 }, staffHeader);
  assert(staffSettings.status === 403, 'Staff PUT /api/settings rejected with 403 Forbidden');

  let staffRefund = await api.post('/admin/payments/507f1f77bcf86cd799439011/refund', {}, staffHeader);
  assert(staffRefund.status === 403, 'Staff POST /api/admin/payments/:id/refund rejected with 403 Forbidden');

  // 12. IDOR / BOLA CROSS-CUSTOMER DATA PRIVACY CHECK
  console.log('\n--- 12. IDOR / Cross-Customer Access Control ---');
  // Create another customer account (Victim)
  const victimEmail = `victim_${uniqueId}@savoria.com`;
  const regVictim = await api.post('/auth/register', {
    name: 'Victim Patron',
    email: victimEmail,
    password: 'VictimPassword@123',
    phone: '+1 (555) 111-2222'
  });
  const victimToken = regVictim.data.data.token;
  const victimHeader = { headers: { Authorization: `Bearer ${victimToken}` } };

  // Fetch a valid dish for the order
  const menuListRes = await api.get('/menu');
  const menuItems = Array.isArray(menuListRes.data.data) ? menuListRes.data.data : (Array.isArray(menuListRes.data) ? menuListRes.data : []);
  const validDish = menuItems[0];

  // 12a. Victim places an order
  if (validDish && validDish._id) {
    const victimOrderRes = await api.post('/orders', {
      customer: { name: 'Victim Patron', email: victimEmail, phone: '+1 (555) 111-2222' },
      items: [{ menuItemId: validDish._id, name: validDish.name, price: validDish.price, quantity: 1 }],
      orderType: 'takeaway',
      paymentMethod: 'cash'
    }, victimHeader);

    assert(victimOrderRes.status === 201, 'Victim successfully creates an order');
    const victimOrderId = victimOrderRes.data.data?._id;
    assert(victimOrderId, 'Victim order ID generated');

    // Attacker customer attempts to cancel victim's order
    let attackerCancelRes = await api.post(`/orders/${victimOrderId}/cancel`, {
      reason: 'Malicious cancellation attempt'
    }, custHeader);
    assert(attackerCancelRes.status === 403, 'Attacker customer cannot cancel another customer order (403 Forbidden)');
  }

  // 12b. Victim creates a reservation
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 10);
  // Avoid Monday (restaurant closed)
  if (targetDate.getDay() === 1) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const resDateStr = targetDate.toISOString().split('T')[0];

  const victimResRes = await api.post('/reservations', {
    guestName: 'Victim Patron',
    guestEmail: victimEmail,
    guestPhone: '+1 (555) 111-2222',
    guestsCount: 2,
    reservationDate: resDateStr,
    timeSlot: '19:00',
    specialRequests: 'Window booth preferred'
  }, victimHeader);

  if (victimResRes.status !== 201) {
    console.error('victimResRes failed with status:', victimResRes.status, victimResRes.data);
  }
  assert(victimResRes.status === 201, 'Victim successfully creates a reservation');
  const victimResId = victimResRes.data.data?._id;
  assert(victimResId, 'Victim reservation ID generated');

  // Attacker customer attempts to cancel victim's reservation
  let attackerCancelResRes = await api.post(`/reservations/${victimResId}/cancel`, {
    reason: 'Malicious reservation cancellation attempt'
  }, custHeader);
  assert(attackerCancelResRes.status === 403, 'Attacker customer cannot cancel another customer reservation (403 Forbidden)');

  // 12c. Cross-customer history scoping: Attacker passes ?email=victimEmail to /my-orders & /my-reservations
  let attackerSpyOrders = await api.get(`/orders/my-orders?email=${encodeURIComponent(victimEmail)}`, custHeader);
  assert(attackerSpyOrders.status === 200, 'Customer GET /my-orders with spoofed ?email returns 200');
  const spyOrdersList = attackerSpyOrders.data.data || [];
  const leakedVictimOrders = spyOrdersList.filter(o => o.customer?.email === victimEmail);
  assert(leakedVictimOrders.length === 0, 'Customer GET /my-orders does NOT leak victim orders despite ?email override');

  let attackerSpyReservations = await api.get(`/reservations/my-reservations?email=${encodeURIComponent(victimEmail)}`, custHeader);
  assert(attackerSpyReservations.status === 200, 'Customer GET /my-reservations with spoofed ?email returns 200');
  const spyResList = attackerSpyReservations.data.data || [];
  const leakedVictimRes = spyResList.filter(r => r.guestEmail === victimEmail);
  assert(leakedVictimRes.length === 0, 'Customer GET /my-reservations does NOT leak victim reservations despite ?email override');

  // 13. SENSITIVE INFORMATION EXPOSURE CHECK
  console.log('\n--- 13. Sensitive Information Exposure Check ---');
  let paymentConfigRes = await api.get('/payments/config');
  assert(paymentConfigRes.status === 200, 'GET /api/payments/config returns 200');
  const paymentConfigData = JSON.stringify(paymentConfigRes.data);
  assert(!paymentConfigData.includes('key_secret') && !paymentConfigData.includes('secret_key'), 'Public payment config does NOT expose payment gateway secret key');

  // 14. SUMMARY RESULTS
  console.log('\n======================================================');
  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;
  console.log(`PHASE 6 AUDIT RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAuthAndPermissionAudit().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
