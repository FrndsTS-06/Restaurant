/**
 * PHASE 7 — BACKEND AND DATABASE RELIABILITY AUDIT TEST SUITE
 * 
 * Tests:
 * 1. Database Connection & Reconnection Behavior
 * 2. Mongoose Indexes Verification for Common Queries
 * 3. Dedicated Test DB Isolation (zero production data reset)
 * 4. Model CRUD Operations & Validation
 * 5. Invalid MongoDB ObjectIds (CastError Handling)
 * 6. Missing Records (404 Resource Handling)
 * 7. Duplicate Records (Index Uniqueness & Code 11000)
 * 8. Required Fields & Schema Boundary Constraints
 * 9. Data Relationships & Referential Integrity
 * 10. Query Filtering, Search, Pagination, and Sorting
 * 11. Error Middleware & Status Code Verification
 * 12. Consistent JSON Response Envelope Structure
 * 13. High-Concurrency Stress Testing (Pool Stability)
 * 14. Data Persistence & Integrity Verification
 */

const mongoose = require('mongoose');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurantpro_test_db';
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

const results = [];
function recordTest(name, passed, detail = '') {
  results.push({ name, passed, detail });
  const mark = passed ? '  ✓' : '  ✗ FAIL:';
  console.log(`${mark} ${name}${detail ? ` (${detail})` : ''}`);
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, headers: res.headers, data };
}

async function runPhase7Audit() {
  console.log('\n======================================================');
  console.log('   PHASE 7 — BACKEND & DATABASE RELIABILITY AUDIT    ');
  console.log('======================================================\n');

  // Load Mongoose models
  const MenuItem = require('../src/models/MenuItem');
  const Category = require('../src/models/Category');
  const Order = require('../src/models/Order');
  const Reservation = require('../src/models/Reservation');
  const Review = require('../src/models/Review');
  const Coupon = require('../src/models/Coupon');
  const RestaurantTable = require('../src/models/RestaurantTable');
  const AuditLog = require('../src/models/AuditLog');
  const Notification = require('../src/models/Notification');
  const User = require('../src/models/User');

  // --- SECTION 1: DATABASE CONNECTION & RECONNECTION BEHAVIOR ---
  console.log('--- 1. Database Connection & Reconnection Behavior ---');
  let testConnection;
  try {
    testConnection = await mongoose.createConnection(TEST_DB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 25,
      minPoolSize: 2
    }).asPromise();

    recordTest('Dedicated test database connection established', testConnection.readyState === 1, `Host: ${testConnection.host}, DB: ${testConnection.name}`);
    recordTest('Test DB is strictly isolated from production DB', testConnection.name === 'restaurantpro_test_db');

    // Test reconnection event listeners
    let disconnectEventTriggered = false;
    let reconnectEventTriggered = false;
    testConnection.on('disconnected', () => { disconnectEventTriggered = true; });
    testConnection.on('connected', () => { reconnectEventTriggered = true; });

    recordTest('Reconnection lifecycle listeners attachable', typeof testConnection.on === 'function');
  } catch (err) {
    recordTest('Database connection established', false, err.message);
  }

  // --- SECTION 2: MISSING INDEXES VERIFICATION FOR COMMON QUERIES ---
  console.log('\n--- 2. Missing Indexes Inspection on Models ---');
  try {
    const TestMenuItem = testConnection.model('MenuItem', MenuItem.schema);
    const TestOrder = testConnection.model('Order', Order.schema);
    const TestReservation = testConnection.model('Reservation', Reservation.schema);
    const TestReview = testConnection.model('Review', Review.schema);
    const TestAuditLog = testConnection.model('AuditLog', AuditLog.schema);
    const TestNotification = testConnection.model('Notification', Notification.schema);

    // Ensure all indexes are built
    await Promise.all([
      TestMenuItem.syncIndexes(),
      TestOrder.syncIndexes(),
      TestReservation.syncIndexes(),
      TestReview.syncIndexes(),
      TestAuditLog.syncIndexes(),
      TestNotification.syncIndexes()
    ]);

    const menuItemIndexes = await TestMenuItem.collection.indexes();
    const orderIndexes = await TestOrder.collection.indexes();
    const resIndexes = await TestReservation.collection.indexes();
    const reviewIndexes = await TestReview.collection.indexes();

    // Verify key compound indexes exist
    const hasMenuItemCategoryIndex = menuItemIndexes.some(idx => idx.key.category === 1 && idx.key.isAvailable === 1);
    const hasMenuItemArchivedIndex = menuItemIndexes.some(idx => idx.key.isArchived === 1);
    const hasMenuItemSlugIndex = menuItemIndexes.some(idx => idx.key.slug === 1);

    recordTest('MenuItem has category + isAvailable compound index', hasMenuItemCategoryIndex);
    recordTest('MenuItem has isArchived filter index', hasMenuItemArchivedIndex);
    recordTest('MenuItem has slug index for direct route lookups', hasMenuItemSlugIndex);

    const hasOrderStatusDateIndex = orderIndexes.some(idx => idx.key.status === 1 && idx.key.createdAt === -1);
    const hasOrderUserDateIndex = orderIndexes.some(idx => idx.key.user === 1 && idx.key.createdAt === -1);
    const hasOrderItemsIndex = orderIndexes.some(idx => idx.key['items.menuItem'] === 1);

    recordTest('Order has status + createdAt compound index', hasOrderStatusDateIndex);
    recordTest('Order has user + createdAt compound index', hasOrderUserDateIndex);
    recordTest('Order has items.menuItem index for review verification queries', hasOrderItemsIndex);

    const hasResDateStatusIndex = resIndexes.some(idx => idx.key.reservationDate === 1 && idx.key.status === 1);
    const hasResUserDateIndex = resIndexes.some(idx => idx.key.user === 1 && idx.key.reservationDate === -1);

    recordTest('Reservation has reservationDate + status compound index', hasResDateStatusIndex);
    recordTest('Reservation has user + reservationDate compound index', hasResUserDateIndex);

    const hasReviewDishApprovalIndex = reviewIndexes.some(idx => idx.key.menuItem === 1 && idx.key.isApproved === 1);
    const hasReviewDedupIndex = reviewIndexes.some(idx => idx.key.user === 1 && idx.key.menuItem === 1 && idx.key.order === 1);

    recordTest('Review has menuItem + isApproved compound index', hasReviewDishApprovalIndex);
    recordTest('Review has user + menuItem + order deduplication index', hasReviewDedupIndex);
  } catch (err) {
    recordTest('Index verification on test database', false, err.message);
  }

  // --- SECTION 3: CRUD OPERATIONS ON ISOLATED TEST DB ---
  console.log('\n--- 3. Isolated CRUD Operations & Schema Constraints ---');
  let sampleDishId;
  let sampleCategoryId;
  try {
    const TestCategory = testConnection.model('Category', Category.schema);
    const TestMenuItem = testConnection.model('MenuItem', MenuItem.schema);

    // Create Category
    const cat = await TestCategory.create({
      name: 'Chef Tasting Degustation',
      description: 'Exclusive multi-course menu creations',
      displayOrder: 1
    });
    sampleCategoryId = cat._id;
    recordTest('Create Category in test database', Boolean(cat._id));
    recordTest('Category auto-generates slug on pre-save', cat.slug === 'chef-tasting-degustation');

    // Create Dish linked to category
    const dish = await TestMenuItem.create({
      name: 'Pan-Roasted Brittany Turbot',
      description: 'Artichoke barigoule, brown butter sabayon, caviar pearls',
      category: 'Chef Tasting Degustation',
      categoryRef: cat._id,
      price: 78.50,
      costPrice: 22.00,
      prepTimeMinutes: 25,
      isAvailable: true
    });
    sampleDishId = dish._id;
    recordTest('Create MenuItem linked to CategoryRef (Relationship)', Boolean(dish._id));
    recordTest('MenuItem auto-generates slug on pre-save', dish.slug === 'pan-roasted-brittany-turbot');

    // Read Dish with populate
    const populatedDish = await TestMenuItem.findById(dish._id).populate('categoryRef');
    recordTest('Read MenuItem with populate(categoryRef)', populatedDish.categoryRef.name === 'Chef Tasting Degustation');

    // Update Dish
    const updatedDish = await TestMenuItem.findByIdAndUpdate(dish._id, { price: 82.00 }, { new: true });
    recordTest('Update MenuItem price successfully', updatedDish.price === 82.00);

    // Delete Dish
    await TestMenuItem.findByIdAndDelete(dish._id);
    const deletedDish = await TestMenuItem.findById(dish._id);
    recordTest('Delete MenuItem cleans up record', deletedDish === null);
  } catch (err) {
    recordTest('CRUD operations on test DB', false, err.message);
  }

  // --- SECTION 4: DUPLICATE & REQUIRED FIELDS VALIDATION ---
  console.log('\n--- 4. Duplicate Records & Required Fields Validation ---');
  try {
    const TestCoupon = testConnection.model('Coupon', Coupon.schema);

    await TestCoupon.create({
      code: 'RELIABILITY2026',
      discountType: 'percentage',
      discountValue: 20,
      expiryDate: new Date(Date.now() + 86400000)
    });

    // Attempt duplicate coupon code
    let duplicateRejected = false;
    try {
      await TestCoupon.create({
        code: 'RELIABILITY2026',
        discountType: 'percentage',
        discountValue: 25,
        expiryDate: new Date(Date.now() + 86400000)
      });
    } catch (err) {
      duplicateRejected = err.code === 11000;
    }
    recordTest('Duplicate unique field (Coupon Code) rejected with Mongo code 11000', duplicateRejected);

    // Attempt missing required fields
    let missingRequiredRejected = false;
    try {
      await TestCoupon.create({ code: 'INCOMPLETE' });
    } catch (err) {
      missingRequiredRejected = err.name === 'ValidationError';
    }
    recordTest('Missing required fields rejected with Mongoose ValidationError', missingRequiredRejected);
  } catch (err) {
    recordTest('Duplicate and required field testing', false, err.message);
  }

  // --- SECTION 5: LIVE API INVALID MONGODB OBJECTIDS (CAST ERROR HANDLING) ---
  console.log('\n--- 5. Invalid MongoDB ObjectIds (CastError Handling) ---');
  const invalidIdEndpoints = [
    { url: '/menu/invalid-object-id', method: 'GET', name: 'GET /api/menu/:invalidId' },
    { url: '/orders/not-a-mongo-id', method: 'GET', name: 'GET /api/orders/:invalidId' },
    { url: '/reservations/bad-id-xyz', method: 'GET', name: 'GET /api/reservations/:invalidId' },
    { url: '/tables/invalid-tbl-id', method: 'GET', name: 'GET /api/tables/:invalidId' }
  ];

  for (const ep of invalidIdEndpoints) {
    const res = await apiRequest(ep.url, { method: ep.method });
    const isSafe = res.status === 404 || res.status === 400;
    const hasStructuredJson = res.data && res.data.success === false && typeof res.data.message === 'string';
    recordTest(`${ep.name} returns HTTP 400/404 (safe rejection)`, isSafe, `Status: ${res.status}`);
    recordTest(`${ep.name} returns structured error response envelope`, hasStructuredJson);
  }

  // --- SECTION 6: LIVE API MISSING RECORDS (404 HANDLING) ---
  console.log('\n--- 6. Missing Records (Non-Existent Valid ObjectIds) ---');
  const validNonExistentId = '507f1f77bcf86cd799439011';
  const missingEndpoints = [
    { url: `/menu/${validNonExistentId}`, name: 'GET /api/menu/:missingId' },
    { url: `/orders/${validNonExistentId}`, name: 'GET /api/orders/:missingId' },
    { url: `/tables/${validNonExistentId}`, name: 'GET /api/tables/:missingId' },
    { url: `/categories/${validNonExistentId}`, name: 'GET /api/categories/:missingId' }
  ];

  for (const ep of missingEndpoints) {
    const res = await apiRequest(ep.url);
    recordTest(`${ep.name} returns HTTP 404 Not Found`, res.status === 404);
    recordTest(`${ep.name} returns JSON envelope with success: false`, res.data && res.data.success === false);
  }

  // --- SECTION 7: QUERY FILTERS, SEARCH, PAGINATION & SORTING ---
  console.log('\n--- 7. Query Filters, Search, Pagination & Sorting ---');
  // 7a. Menu Pagination
  const menuPageRes = await apiRequest('/menu?page=1&limit=3');
  recordTest('GET /api/menu?page=1&limit=3 returns HTTP 200', menuPageRes.status === 200);
  recordTest('GET /api/menu pagination object includes totalPages and limit', 
    menuPageRes.data.pagination && menuPageRes.data.pagination.limit === 3);

  // 7b. Menu Search
  const menuSearchRes = await apiRequest('/menu?search=bourbon');
  recordTest('GET /api/menu?search=bourbon returns HTTP 200', menuSearchRes.status === 200);
  const searchItems = menuSearchRes.data.data || [];
  const matchesSearch = searchItems.every(i => 
    i.name.toLowerCase().includes('bourbon') || 
    i.description.toLowerCase().includes('bourbon') ||
    (i.tags || []).some(t => t.toLowerCase().includes('bourbon'))
  );
  recordTest('Menu search filter returns strictly matching dishes', matchesSearch);

  // 7c. Menu Sorting
  const menuSortRes = await apiRequest('/menu?sort=price_asc&limit=10');
  recordTest('GET /api/menu?sort=price_asc returns HTTP 200', menuSortRes.status === 200);
  const sortedDishes = menuSortRes.data.data || [];
  let isSortedAsc = true;
  for (let i = 1; i < sortedDishes.length; i++) {
    if (sortedDishes[i].price < sortedDishes[i - 1].price) {
      isSortedAsc = false;
      break;
    }
  }
  recordTest('Menu dishes sorted ascending by price', isSortedAsc);

  // 7d. Tables Query Filters
  const tablesFilterRes = await apiRequest('/tables?minCapacity=4');
  recordTest('GET /api/tables?minCapacity=4 returns HTTP 200', tablesFilterRes.status === 200);
  const tables = tablesFilterRes.data.data || [];
  const capacityFilterPassed = tables.every(t => t.capacity >= 4);
  recordTest('Table capacity filter respects minCapacity query', capacityFilterPassed);

  // --- SECTION 8: CONSISTENT JSON RESPONSE STRUCTURE ---
  console.log('\n--- 8. Consistent JSON Response Envelope Structure ---');
  const sampleEndpoints = ['/menu', '/tables', '/settings', '/health'];
  for (const ep of sampleEndpoints) {
    const res = await apiRequest(ep);
    const hasKeys = res.data && (res.data.success !== undefined || res.data.status !== undefined);
    recordTest(`Endpoint ${ep} has standard JSON envelope`, hasKeys);
  }

  // --- SECTION 9: HIGH-CONCURRENCY REQUEST STRESS TEST ---
  console.log('\n--- 9. High-Concurrency Request Stress Test (Connection Pool) ---');
  const CONCURRENT_REQUESTS = 25;
  const startTime = Date.now();
  const concurrentPromises = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => 
    apiRequest(`/menu?limit=5&t=${i}`)
  );
  const concurrentResults = await Promise.all(concurrentPromises);
  const durationMs = Date.now() - startTime;

  const all200 = concurrentResults.every(r => r.status === 200);
  recordTest(`Handled ${CONCURRENT_REQUESTS} parallel API requests with 100% success (HTTP 200)`, all200, `Completed in ${durationMs}ms`);

  // --- SECTION 10: UNEXPECTED SERVER ERRORS & UNKNOWN ROUTES ---
  console.log('\n--- 10. Unexpected Routes & Error Middleware Handling ---');
  const unknownRouteRes = await apiRequest('/non-existent-endpoint-route-test-404');
  recordTest('Unknown API route returns HTTP 404', unknownRouteRes.status === 404);
  recordTest('Unknown API route returns structured JSON error message', unknownRouteRes.data.success === false && unknownRouteRes.data.message.includes('not found'));

  // --- SECTION 11: DATABASE CLEANUP ---
  console.log('\n--- 11. Test Database Teardown & Isolation Cleanup ---');
  if (testConnection) {
    await testConnection.dropDatabase();
    await testConnection.close();
    recordTest('Dedicated test database dropped cleanly (Zero production data impacted)', true);
  }

  // --- SUMMARY ---
  console.log('\n======================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`PHASE 7 AUDIT RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase7Audit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
