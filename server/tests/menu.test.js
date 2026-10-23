const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const MenuItem = require('../src/models/MenuItem');
const Category = require('../src/models/Category');

let server;
let baseUrl;
let adminToken = '';
let customerToken = '';
let staffToken = '';
let createdDishId = '';
let createdCategoryId = '';

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

// Setup auth tokens
test('SETUP: Authenticate Admin, Staff, and Customer users', async () => {
  // Admin
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });
  const adminJson = await adminRes.json();
  assert.strictEqual(adminRes.status, 200);
  adminToken = adminJson.data.token;

  // Staff
  const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@savoria.com', password: 'Staff@123' })
  });
  const staffJson = await staffRes.json();
  assert.strictEqual(staffRes.status, 200);
  staffToken = staffJson.data.token;

  // Customer
  const custRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
  });
  const custJson = await custRes.json();
  assert.strictEqual(custRes.status, 200);
  customerToken = custJson.data.token;
});

// ==========================================
// 1. UNAUTHORIZED MODIFICATIONS (SECURITY & RBAC)
// ==========================================
test('Unauthenticated user cannot create dish (401)', async () => {
  const res = await fetch(`${baseUrl}/api/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized Dish', price: 25, category: 'Mains', description: 'Test' })
  });
  assert.strictEqual(res.status, 401);
});

test('Customer cannot create dish (403 Forbidden)', async () => {
  const res = await fetch(`${baseUrl}/api/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ name: 'Customer Dish', price: 25, category: 'Mains', description: 'Test' })
  });
  const json = await res.json();
  assert.strictEqual(res.status, 403);
  assert.strictEqual(json.success, false);
});

test('Staff cannot create or delete dish (403 Forbidden)', async () => {
  const res = await fetch(`${baseUrl}/api/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ name: 'Staff Dish', price: 25, category: 'Mains', description: 'Test' })
  });
  assert.strictEqual(res.status, 403);
});

test('Customer cannot create or delete categories (403 Forbidden)', async () => {
  const res = await fetch(`${baseUrl}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ name: 'Unauthorized Category' })
  });
  assert.strictEqual(res.status, 403);
});

// ==========================================
// 2. FILE UPLOAD VALIDATION & PERMISSIONS
// ==========================================
test('Upload without token returns 401 Unauthorized', async () => {
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST'
  });
  assert.strictEqual(res.status, 401);
});

test('Upload with customer token returns 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

test('Upload with invalid file format (text/plain) returns 400 Bad Request', async () => {
  const boundary = '----WebKitFormBoundaryTest123';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="image"; filename="malicious.txt"',
    'Content-Type: text/plain',
    '',
    'This is a text file, not a permitted image',
    `--${boundary}--`
  ].join('\r\n');

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body
  });

  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.message.includes('Invalid file format'));
});

test('Upload valid image file with Admin token succeeds (201)', async () => {
  // 1x1 transparent PNG binary bytes
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const boundary = '----WebKitFormBoundaryPngTest456';

  const pre = Buffer.from([
    `--${boundary}`,
    'Content-Disposition: form-data; name="image"; filename="tasting_dish.png"',
    'Content-Type: image/png',
    '',
    ''
  ].join('\r\n'));

  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([pre, pngBytes, post]);

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body
  });

  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.url, 'Must return secure image URL');
});

// ==========================================
// 3. ADMIN DISH CREATION & CUSTOMER DISCOVERY
// ==========================================
test('Admin creates new dish in MongoDB', async () => {
  const dishPayload = {
    name: 'Pan-Roasted Duck Breast à l’Orange',
    description: 'Heritage duck breast with blood orange reduction, heirloom parsnip mousseline, and crispy sunchoke chips.',
    category: 'Mains',
    price: 52.00,
    costPrice: 18.00,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    tags: ['Heritage', 'Signature'],
    dietary: ['Gluten-Free', 'Dairy-Free'],
    allergens: ['Poultry'],
    ingredients: ['Duck Breast', 'Blood Orange', 'Parsnips', 'Sunchokes'],
    prepTimeMinutes: 25,
    calories: 620,
    isAvailable: true,
    isFeatured: true
  };

  const res = await fetch(`${baseUrl}/api/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(dishPayload)
  });

  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.name, 'Pan-Roasted Duck Breast à l’Orange');
  assert.strictEqual(json.data.price, 52.00);
  assert.strictEqual(json.data.isAvailable, true);
  assert.ok(json.data._id);

  createdDishId = json.data._id;
});

test('Customer can find newly created dish on public menu', async () => {
  const res = await fetch(`${baseUrl}/api/menu?search=Duck`);
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  const found = json.data.find(d => d._id === createdDishId);
  assert.ok(found, 'Created dish must be returned in customer menu search');
  assert.strictEqual(found.name, 'Pan-Roasted Duck Breast à l’Orange');
  assert.strictEqual(found.price, 52.00);
});

// ==========================================
// 4. DISH EDITING & PERSISTENCE VERIFICATION
// ==========================================
test('Admin edits dish price and description, customer observes changes', async () => {
  // Admin updates price to 56.50 and updates description
  const updateRes = await fetch(`${baseUrl}/api/menu/${createdDishId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      price: 56.50,
      description: 'Updated vintage preparation with candied kumquats.'
    })
  });

  const updateJson = await updateRes.json();
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateJson.success, true);
  assert.strictEqual(updateJson.data.price, 56.50);

  // Customer fetches dish by ID
  const custRes = await fetch(`${baseUrl}/api/menu/${createdDishId}`);
  const custJson = await custRes.json();
  assert.strictEqual(custRes.status, 200);
  assert.strictEqual(custJson.data.price, 56.50);
  assert.strictEqual(custJson.data.description, 'Updated vintage preparation with candied kumquats.');

  // Verify direct MongoDB persistence
  const dbItem = await MenuItem.findById(createdDishId);
  assert.strictEqual(dbItem.price, 56.50);
});

// ==========================================
// 5. AVAILABILITY TOGGLE (SOLD-OUT HANDLING)
// ==========================================
test('Admin marks dish as sold out, customer filters observe availability status', async () => {
  // 1. Mark as sold out
  const toggleRes = await fetch(`${baseUrl}/api/menu/${createdDishId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ isAvailable: false })
  });
  assert.strictEqual(toggleRes.status, 200);

  // 2. Customer checks available-only dishes -> must be excluded
  const availRes = await fetch(`${baseUrl}/api/menu?isAvailable=true`);
  const availJson = await availRes.json();
  const inAvail = availJson.data.find(d => d._id === createdDishId);
  assert.strictEqual(inAvail, undefined, 'Sold-out dish must be excluded from available-only view');

  // 3. Customer checks sold-out dishes -> must be included
  const unavailRes = await fetch(`${baseUrl}/api/menu?isAvailable=false`);
  const unavailJson = await unavailRes.json();
  const inUnavail = unavailJson.data.find(d => d._id === createdDishId);
  assert.ok(inUnavail, 'Sold-out dish must be present in sold-out view');
  assert.strictEqual(inUnavail.isAvailable, false);
});

// ==========================================
// 6. ARCHIVE FOOD ITEM
// ==========================================
test('Admin archives dish, completely hides it from customer view', async () => {
  // Archive dish
  const archRes = await fetch(`${baseUrl}/api/menu/${createdDishId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ isArchived: true })
  });
  assert.strictEqual(archRes.status, 200);

  // Customer standard menu query -> hidden
  const custMenuRes = await fetch(`${baseUrl}/api/menu?limit=50`);
  const custMenuJson = await custMenuRes.json();
  const onCustMenu = custMenuJson.data.find(d => d._id === createdDishId);
  assert.strictEqual(onCustMenu, undefined, 'Archived dish must be hidden from regular customer menu');

  // Admin query with includeArchived=true -> visible
  const adminMenuRes = await fetch(`${baseUrl}/api/menu?includeArchived=true&limit=50`);
  const adminMenuJson = await adminMenuRes.json();
  const onAdminMenu = adminMenuJson.data.find(d => d._id === createdDishId);
  assert.ok(onAdminMenu, 'Archived dish must be visible to admin with includeArchived flag');
  assert.strictEqual(onAdminMenu.isArchived, true);
});

// ==========================================
// 7. CATEGORY MANAGEMENT (CRUD)
// ==========================================
test('Admin creates, edits, and deletes category', async () => {
  // 1. Create Category
  const createCatRes = await fetch(`${baseUrl}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Sommelier Reserve',
      description: 'Curated Grand Cru wines and vintage champagnes.',
      displayOrder: 9
    })
  });
  const createCatJson = await createCatRes.json();
  assert.strictEqual(createCatRes.status, 201);
  assert.strictEqual(createCatJson.data.name, 'Sommelier Reserve');
  createdCategoryId = createCatJson.data._id;

  // 2. Customer views category
  const getCatRes = await fetch(`${baseUrl}/api/categories`);
  const getCatJson = await getCatRes.json();
  const catFound = getCatJson.data.find(c => c._id === createdCategoryId);
  assert.ok(catFound, 'Created category must appear in customer category listing');

  // 3. Admin edits category
  const updateCatRes = await fetch(`${baseUrl}/api/categories/${createdCategoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ description: 'Updated cellar reserves.' })
  });
  assert.strictEqual(updateCatRes.status, 200);

  // 4. Admin deletes category
  const delCatRes = await fetch(`${baseUrl}/api/categories/${createdCategoryId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(delCatRes.status, 200);

  // 5. Confirm deleted from database
  const finalCatRes = await fetch(`${baseUrl}/api/categories`);
  const finalCatJson = await finalCatRes.json();
  const deletedCatFound = finalCatJson.data.find(c => c._id === createdCategoryId);
  assert.strictEqual(deletedCatFound, undefined, 'Deleted category must no longer appear');
});
