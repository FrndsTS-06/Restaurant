const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
const { JWT_ACCESS_SECRET, JWT_SECRET } = require('../src/config/env');

let server;
let baseUrl;
let adminToken = '';
let staffToken = '';
let customerToken = '';
let customerRefreshToken = '';
let registeredUserEmail = '';
let registeredUserResetToken = '';

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
  if (server) server.close();
  await mongoose.connection.close();
});

// ==========================================
// 1. REGISTRATION & ADMIN PROTECTION TESTS
// ==========================================
test('POST /api/auth/register should create a customer account with tokens', async () => {
  registeredUserEmail = `test_guest_${Date.now()}@savoria.com`;

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Victoria Hawthorne',
      email: registeredUserEmail,
      password: 'Password@123',
      phone: '+1 (555) 765-4321'
    })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.token, 'Must return access token');
  assert.ok(json.data.refreshToken, 'Must return refresh token');
  assert.strictEqual(json.data.user.role, 'customer');
  assert.strictEqual(json.data.user.email, registeredUserEmail);

  customerToken = json.data.token;
  customerRefreshToken = json.data.refreshToken;
});

test('POST /api/auth/register must NEVER allow public admin provisioning (Role Spoofing Prevention)', async () => {
  const spoofEmail = `spoof_admin_${Date.now()}@savoria.com`;

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Malicious Attacker',
      email: spoofEmail,
      password: 'HackerPassword@123',
      role: 'admin' // Attempting privilege escalation
    })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.data.user.role, 'customer', 'Public registration must force role to customer');

  // Verify in MongoDB directly
  const dbUser = await User.findOne({ email: spoofEmail });
  assert.strictEqual(dbUser.role, 'customer', 'Database record must be customer, never admin');
});

test('POST /api/auth/register with duplicate email should be rejected with 400', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Guest',
      email: registeredUserEmail,
      password: 'Password@123'
    })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

test('POST /api/auth/register with short password should be rejected with 400', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Short Password User',
      email: `shortpass_${Date.now()}@savoria.com`,
      password: '123'
    })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

// ==========================================
// 2. LOGIN & CREDENTIAL VERIFICATION TESTS
// ==========================================
test('POST /api/auth/login should authenticate seeded Admin and return tokens', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.token);
  assert.ok(json.data.refreshToken);
  assert.strictEqual(json.data.user.role, 'admin');

  adminToken = json.data.token;

  // Verify AuditLog was recorded for admin login
  const audit = await AuditLog.findOne({ 'changes.event': 'ADMIN_LOGIN' }).sort({ createdAt: -1 });
  assert.ok(audit, 'Admin login must generate an audit log entry');
});

test('POST /api/auth/login should authenticate seeded Staff user', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@savoria.com', password: 'Staff@123' })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.token);
  assert.strictEqual(json.data.user.role, 'staff');

  staffToken = json.data.token;
});

test('POST /api/auth/login with wrong password should return 401', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'IncorrectPassword' })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(json.success, false);
});

test('POST /api/auth/login with nonexistent email should return 401', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_user_xyz@savoria.com', password: 'Password@123' })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(json.success, false);
});

// ==========================================
// 3. ROLE-BASED ACCESS CONTROL (RBAC) & FORBIDDEN ACCESS
// ==========================================
test('Direct request by unauthorized user without token to protected route returns 401', async () => {
  const res = await fetch(`${baseUrl}/api/auth/profile`);
  const json = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(json.success, false);
});

test('Direct request by Customer to Admin-only route returns 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/audit-logs`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 403);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('Forbidden'));
});

test('Direct request by Staff to Admin-only route returns 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/audit-logs`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 403);
  assert.strictEqual(json.success, false);
});

test('Direct request by Staff to Staff-permitted route returns 200 Success', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
});

test('Direct request by Admin to Admin route returns 200 Success', async () => {
  const res = await fetch(`${baseUrl}/api/audit-logs`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
});

// ==========================================
// 4. REFRESH TOKEN ROTATION & SESSION MANAGEMENT
// ==========================================
test('POST /api/auth/refresh-token rotates refresh token and issues new access token', async () => {
  const res = await fetch(`${baseUrl}/api/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: customerRefreshToken })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.token, 'Must return new access token');
  assert.ok(json.data.refreshToken, 'Must return new rotated refresh token');
  assert.notStrictEqual(json.data.refreshToken, customerRefreshToken, 'Refresh token must be rotated');

  const oldToken = customerRefreshToken;
  customerToken = json.data.token;
  customerRefreshToken = json.data.refreshToken;

  // REUSE DETECTION: Using the old rotated token must fail!
  const reuseRes = await fetch(`${baseUrl}/api/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: oldToken })
  });
  assert.ok(reuseRes.status === 401 || reuseRes.status === 403, 'Reused old refresh token must be rejected');
});

test('Expired or tampered token returns 401 Unauthorized', async () => {
  // Generate expired token signed 2 hours ago
  const secret = JWT_ACCESS_SECRET || JWT_SECRET;
  const expiredToken = jwt.sign(
    { id: new mongoose.Types.ObjectId(), role: 'customer' },
    secret,
    { expiresIn: '1ms' }
  );

  // Wait 10ms for expiration
  await new Promise(r => setTimeout(r, 10));

  const res = await fetch(`${baseUrl}/api/auth/profile`, {
    headers: { 'Authorization': `Bearer ${expiredToken}` }
  });

  const json = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(json.success, false);
});

// ==========================================
// 5. CUSTOMER PROFILE MANAGEMENT
// ==========================================
test('GET /api/auth/profile returns current authenticated user details', async () => {
  const res = await fetch(`${baseUrl}/api/auth/profile`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.email, registeredUserEmail);
  assert.strictEqual(json.data.name, 'Victoria Hawthorne');
});

test('PUT /api/auth/profile updates profile and persists to MongoDB', async () => {
  const res = await fetch(`${baseUrl}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      name: 'Lady Victoria Hawthorne',
      phone: '+1 (555) 999-8888',
      address: {
        street: '750 Park Avenue, Penthouse B',
        city: 'Manhattan',
        state: 'NY',
        zipCode: '10021'
      },
      role: 'admin' // Attempted role elevation must be rejected/ignored
    })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.name, 'Lady Victoria Hawthorne');
  assert.strictEqual(json.data.role, 'customer', 'Role elevation in profile update must be prevented');

  // Verify in MongoDB
  const updatedUser = await User.findOne({ email: registeredUserEmail });
  assert.strictEqual(updatedUser.name, 'Lady Victoria Hawthorne');
  assert.strictEqual(updatedUser.address.city, 'Manhattan');
  assert.strictEqual(updatedUser.role, 'customer');
});

// ==========================================
// 6. FORGOT PASSWORD & RESET PASSWORD FLOW
// ==========================================
test('POST /api/auth/forgot-password generates expiring reset token', async () => {
  const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: registeredUserEmail })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.resetToken, 'Must generate one-time reset token');

  registeredUserResetToken = json.data.resetToken;

  // Confirm token is stored hashed in MongoDB with expiration
  const userInDb = await User.findOne({ email: registeredUserEmail });
  assert.ok(userInDb.passwordResetToken, 'Hashed token must exist in DB');
  assert.ok(userInDb.passwordResetExpires > Date.now(), 'Expiration must be in the future');
});

test('POST /api/auth/reset-password/:token resets password and allows login with new password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/reset-password/${registeredUserResetToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      newPassword: 'BrandNewSecurePassword@123'
    })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);

  // 1. Old password must fail
  const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: registeredUserEmail, password: 'Password@123' })
  });
  assert.strictEqual(oldLoginRes.status, 401);

  // 2. New password must succeed
  const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: registeredUserEmail, password: 'BrandNewSecurePassword@123' })
  });
  const newLoginJson = await newLoginRes.json();
  assert.strictEqual(newLoginRes.status, 200);
  assert.strictEqual(newLoginJson.success, true);
  customerToken = newLoginJson.data.token;
  customerRefreshToken = newLoginJson.data.refreshToken;

  // 3. Re-using the consumed token must fail
  const reuseResetRes = await fetch(`${baseUrl}/api/auth/reset-password/${registeredUserResetToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword: 'AnotherPassword@123' })
  });
  assert.strictEqual(reuseResetRes.status, 400, 'Consumed reset token must be rejected');
});

// ==========================================
// 7. CHANGE PASSWORD WHILE AUTHENTICATED
// ==========================================
test('PUT /api/auth/change-password validates current password and updates to new password', async () => {
  // Attempt with wrong current password
  const wrongRes = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      currentPassword: 'WrongCurrentPassword',
      newPassword: 'UpdatedPassword@456'
    })
  });
  assert.strictEqual(wrongRes.status, 400);

  // Succeed with correct current password
  const correctRes = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      currentPassword: 'BrandNewSecurePassword@123',
      newPassword: 'UpdatedPassword@456'
    })
  });
  const correctJson = await correctRes.json();
  assert.strictEqual(correctRes.status, 200);
  assert.strictEqual(correctJson.success, true);
});

// ==========================================
// 8. LOGOUT & SESSION INVALIDATION
// ==========================================
test('POST /api/auth/logout invalidates session and clears tokens', async () => {
  const res = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: customerRefreshToken
    })
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);

  // Attempting to refresh token after logout must fail
  const postLogoutRefresh = await fetch(`${baseUrl}/api/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: customerRefreshToken })
  });
  assert.strictEqual(postLogoutRefresh.status, 401);
});
