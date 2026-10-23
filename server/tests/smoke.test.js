const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let server;
let baseUrl;

test.before(async () => {
  await connectDB();
  await new Promise((resolve) => {
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

// ============================================================================
// 1. HEALTH CHECKS & SERVICE DISCOVERY
// ============================================================================

test('SMOKE: Root service discovery returns service metadata', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'online');
  assert.strictEqual(data.health, '/api/health');
  assert.strictEqual(data.name, 'RestaurantPro API Platform');
});

test('SMOKE: Health check endpoint /api/health returns healthy DB state', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.database.connected, true);
  assert.strictEqual(data.database.status, 'connected');
  assert.ok(data.uptimeSeconds >= 0);
  assert.ok(data.timestamp);
});

// ============================================================================
// 2. SECURITY HEADERS, RATE LIMITING & CORS
// ============================================================================

test('SMOKE: Security HTTP headers (Helmet) are active on responses', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  // Cross-Origin-Resource-Policy header
  const corp = res.headers.get('cross-origin-resource-policy');
  assert.ok(corp === 'cross-origin' || corp === 'same-origin' || corp !== null);
  // X-DNS-Prefetch-Control or X-Content-Type-Options
  assert.ok(res.headers.get('x-content-type-options') === 'nosniff');
});

test('SMOKE: Rate limit headers are returned on API requests', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  // RateLimit headers (IETF draft standard or standard headers)
  const rateLimitRemaining = res.headers.get('ratelimit-remaining');
  const rateLimitLimit = res.headers.get('ratelimit-limit');
  assert.ok(rateLimitRemaining !== null || rateLimitLimit !== null, 'RateLimit headers should be present');
});

test('SMOKE: Dynamic CORS permits configured client origin and preflight OPTIONS', async () => {
  const res = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET'
    }
  });
  assert.strictEqual(res.status, 204);
  assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
});

test('SMOKE: Dynamic CORS permits Vercel preview domain origin', async () => {
  const res = await fetch(`${baseUrl}/api/health`, {
    headers: {
      'Origin': 'https://restaurantpro-preview-branch.vercel.app'
    }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://restaurantpro-preview-branch.vercel.app');
});

// ============================================================================
// 3. SEO ASSETS & PUBLIC ENDPOINTS
// ============================================================================

test('SMOKE: SEO dynamic sitemap.xml is accessible with valid XML content', async () => {
  const res = await fetch(`${baseUrl}/sitemap.xml`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers.get('content-type').includes('xml'));
  const text = await res.text();
  assert.ok(text.includes('<urlset'));
  assert.ok(text.includes('/menu'));
});

test('SMOKE: SEO robots.txt is accessible with valid crawling directives', async () => {
  const res = await fetch(`${baseUrl}/robots.txt`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers.get('content-type').includes('text/plain'));
  const text = await res.text();
  assert.ok(text.includes('Disallow: /admin'));
  assert.ok(text.includes('Sitemap:'));
});

test('SMOKE: Public catalog endpoints (Menu, Categories, Settings) return database records', async () => {
  const [menuRes, catRes, setRes] = await Promise.all([
    fetch(`${baseUrl}/api/menu`),
    fetch(`${baseUrl}/api/categories`),
    fetch(`${baseUrl}/api/settings`)
  ]);

  assert.strictEqual(menuRes.status, 200);
  assert.strictEqual(catRes.status, 200);
  assert.strictEqual(setRes.status, 200);

  const menuData = await menuRes.json();
  const catData = await catRes.json();
  const setData = await setRes.json();

  assert.ok(Array.isArray(menuData.data), 'Menu items should be an array');
  assert.ok(menuData.data.length > 0, 'Should have active menu items in database');
  assert.ok(Array.isArray(catData.data), 'Categories should be an array');
  assert.ok(catData.data.length > 0, 'Should have categories in database');
  assert.ok(setData.data.restaurantName, 'Restaurant name should exist in settings');
});

// ============================================================================
// 4. AUTHENTICATION & SECURITY BOUNDARIES
// ============================================================================

test('SMOKE: Protected Admin routes strictly reject unauthenticated visitors with 401', async () => {
  const res = await fetch(`${baseUrl}/api/admin/analytics`);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('SMOKE: Authenticated Customer token is rejected from Admin staff routes with 403', async () => {
  // Login as Customer
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
  });
  assert.strictEqual(loginRes.status, 200);
  const { data } = await loginRes.json();
  const customerToken = data.token;

  // Attempt Admin endpoint
  const adminRes = await fetch(`${baseUrl}/api/admin/staff`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(adminRes.status, 403);
});

// ============================================================================
// 5. DATABASE INTEGRITY & SEEDING VALIDATION
// ============================================================================

test('SMOKE: Seeded Admin account successfully authenticates and accesses analytics', async () => {
  // Login as Admin
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });
  assert.strictEqual(loginRes.status, 200);
  const { data } = await loginRes.json();
  assert.strictEqual(data.user.role, 'admin');
  const adminToken = data.token;

  // Access Admin Analytics
  const analyticsRes = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(analyticsRes.status, 200);
  const analyticsData = await analyticsRes.json();
  assert.ok(analyticsData.data.totalOrders !== undefined);
  assert.ok(Array.isArray(analyticsData.data.salesChart));
  assert.ok(Array.isArray(analyticsData.data.popularDishes));
});
