const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const MenuItem = require('../src/models/MenuItem');

let server;
let baseUrl;
let adminToken = '';
let customerToken = '';
let testDishId = '';
let uploadedModelFilename = '';

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

  // Log in as Admin
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });
  const adminData = await adminRes.json();
  assert.strictEqual(adminRes.status, 200, 'Admin login failed');
  adminToken = adminData.data.token;

  // Log in as Customer
  const custRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
  });
  const custData = await custRes.json();
  assert.strictEqual(custRes.status, 200, 'Customer login failed');
  customerToken = custData.data.token;
});

test.after(async () => {
  if (testDishId) {
    await MenuItem.findByIdAndDelete(testDishId);
  }
  if (server) {
    server.close();
  }
  await mongoose.connection.close();
});

// ==========================================
// 1. AUTHENTICATION & AUTHORIZATION CONTROLS
// ==========================================
test('Phase 6: 3D Model upload without token returns 401 Unauthorized', async () => {
  const res = await fetch(`${baseUrl}/api/upload/model3d`, {
    method: 'POST'
  });
  assert.strictEqual(res.status, 401);
});

test('Phase 6: 3D Model upload with customer token returns 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/upload/model3d`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

// ==========================================
// 2. INPUT VALIDATION & FILE TYPE REJECTION
// ==========================================
test('Phase 6: Uploading non-GLB/GLTF file format returns 400 Bad Request', async () => {
  const boundary = '----BoundaryPhase6InvalidExt';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="model3d"; filename="malicious_script.sh"',
    'Content-Type: application/x-sh',
    '',
    '#!/bin/bash\necho "exploit"',
    `--${boundary}--`
  ].join('\r\n');

  const res = await fetch(`${baseUrl}/api/upload/model3d`, {
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
  assert.ok(json.message.includes('Only .glb and .gltf files are permitted'));
});

test('Phase 6: Uploading fake .glb file without magic glTF header returns 400 Bad Request', async () => {
  const fakeGlbBytes = Buffer.from('NOT_A_REAL_GLTF_HEADER_GARBAGE_PAYLOAD_12345');
  const boundary = '----BoundaryFakeGlb';

  const pre = Buffer.from([
    `--${boundary}`,
    'Content-Disposition: form-data; name="model3d"; filename="fake_dish.glb"',
    'Content-Type: model/gltf-binary',
    '',
    ''
  ].join('\r\n'));

  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([pre, fakeGlbBytes, post]);

  const res = await fetch(`${baseUrl}/api/upload/model3d`, {
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
  assert.ok(json.message.includes('valid glTF header signature'));
});

// ==========================================
// 3. VALID 3D MODEL UPLOAD & PERSISTENCE
// ==========================================
test('Phase 6: Admin uploads genuine GLB binary header and receives 201 with asset URL', async () => {
  // Construct a minimal valid 12-byte glTF binary header:
  // Magic: 0x46546C67 ('glTF')
  // Version: 2 (uint32 LE)
  // Total length: 12 (uint32 LE)
  const glbHeader = Buffer.alloc(12);
  glbHeader.write('glTF', 0, 4, 'ascii');
  glbHeader.writeUInt32LE(2, 4);
  glbHeader.writeUInt32LE(12, 8);

  const boundary = '----BoundaryValidGlb';
  const pre = Buffer.from([
    `--${boundary}`,
    'Content-Disposition: form-data; name="model3d"; filename="organic_truffle.glb"',
    'Content-Type: model/gltf-binary',
    '',
    ''
  ].join('\r\n'));

  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([pre, glbHeader, post]);

  const res = await fetch(`${baseUrl}/api/upload/model3d`, {
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
  assert.ok(json.data.url.startsWith('/models/food/dish-model-'));
  assert.ok(json.data.filename.endsWith('.glb'));
  uploadedModelFilename = json.data.filename;
});

// ==========================================
// 4. 3D POSTER PREVIEW IMAGE UPLOAD
// ==========================================
test('Phase 6: Admin uploads 3D poster preview image successfully (201)', async () => {
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const boundary = '----BoundaryPosterPng';

  const pre = Buffer.from([
    `--${boundary}`,
    'Content-Disposition: form-data; name="poster"; filename="truffle_poster.png"',
    'Content-Type: image/png',
    '',
    ''
  ].join('\r\n'));

  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([pre, pngBytes, post]);

  const res = await fetch(`${baseUrl}/api/upload/poster`, {
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
  assert.ok(json.data.url);
});

// ==========================================
// 5. DIRECTORY TRAVERSAL PROTECTION ON DELETE
// ==========================================
test('Phase 6: Delete model with path traversal returns 400 Bad Request', async () => {
  const res = await fetch(`${baseUrl}/api/upload/model3d/..%2F..%2Fsecrets.txt`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 400);
});

// ==========================================
// 6. MENU ITEM CREATION WITH 3D METADATA
// ==========================================
test('Phase 6: Admin creates new dish with 3D model metadata and INR price', async () => {
  const newDishPayload = {
    name: 'Atelier Golden Wagyu Sculpture',
    description: 'Gold-leaf infused A5 Miyazaki beef presented with 3D photogrammetric inspection.',
    category: 'Mains',
    price: 4950.00,
    costPrice: 1850.00,
    model3dUrl: `/models/food/${uploadedModelFilename}`,
    modelPosterUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    modelStatus: 'available',
    modelAltText: 'Interactive 3D representation of Golden Wagyu Sculpture',
    isAvailable: true,
    isFeatured: true
  };

  const res = await fetch(`${baseUrl}/api/menu`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newDishPayload)
  });

  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.name, 'Atelier Golden Wagyu Sculpture');
  assert.strictEqual(json.data.price, 4950);
  assert.strictEqual(json.data.modelStatus, 'available');
  assert.strictEqual(json.data.model3dUrl, `/models/food/${uploadedModelFilename}`);

  testDishId = json.data._id;
});

// ==========================================
// 7. PUBLIC FOOD RETRIEVAL INCLUDES 3D ASSETS
// ==========================================
test('Phase 6: Public /api/menu/:id returns persisted 3D model and status', async () => {
  const res = await fetch(`${baseUrl}/api/menu/${testDishId}`);
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.name, 'Atelier Golden Wagyu Sculpture');
  assert.strictEqual(json.data.modelStatus, 'available');
  assert.strictEqual(json.data.model3dUrl, `/models/food/${uploadedModelFilename}`);
});

// ==========================================
// 8. SAFE REMOVAL OF 3D MODEL FILE
// ==========================================
test('Phase 6: Admin safely removes 3D model file from storage', async () => {
  if (!uploadedModelFilename) return;

  const res = await fetch(`${baseUrl}/api/upload/model3d/${uploadedModelFilename}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.filename, uploadedModelFilename);
});
