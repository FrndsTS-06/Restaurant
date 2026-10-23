const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');
const Reservation = require('../src/models/Reservation');
const Review = require('../src/models/Review');
const Coupon = require('../src/models/Coupon');
const Notification = require('../src/models/Notification');
const ContactMessage = require('../src/models/ContactMessage');
const RestaurantSettings = require('../src/models/RestaurantSettings');
const { getDevOutbox, clearDevOutbox } = require('../src/services/emailService');

let server;
let baseUrl;
let adminToken = '';
let customerToken = '';
let customerUser = null;
let testDish = null;
let testCompletedOrder = null;
let testReviewId = null;
let testCouponCode = '';

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
  // Cleanup artifacts created during tests
  if (testDish) {
    await MenuItem.findByIdAndDelete(testDish._id);
    await Review.deleteMany({ menuItem: testDish._id });
  }
  if (testCompletedOrder) {
    await Order.findByIdAndDelete(testCompletedOrder._id);
  }
  await Coupon.deleteMany({ code: { $in: ['TESTAUTUMN20', 'TESTEXPIRED', 'TESTLIMIT'] } });
  await ContactMessage.deleteMany({ email: 'patron-tester@example.com' });
  await Notification.deleteMany({ 'recipient.email': { $in: ['guest@savoria.com', 'patron-tester@example.com', 'test-failed@example.com'] } });
  await RestaurantSettings.findOneAndUpdate({}, {
    restaurantName: 'SAVORIA Haute Cuisine',
    contactEmail: 'concierge@savoria.com'
  });

  if (server) server.close();
  await mongoose.connection.close();
});

// ============================================================================
// 1. SETUP & AUTHENTICATION
// ============================================================================

test('SETUP: Authenticate Admin & Customer, prepare test dish and clear outbox', async () => {
  clearDevOutbox();

  // Admin Login
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });
  const adminJson = await adminRes.json();
  assert.strictEqual(adminRes.status, 200);
  adminToken = adminJson.data.token;

  // Customer Login
  const customerRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
  });
  const customerJson = await customerRes.json();
  assert.strictEqual(customerRes.status, 200);
  customerToken = customerJson.data.token;
  customerUser = customerJson.data.user;

  // Prepare a test dish
  testDish = await MenuItem.create({
    name: 'Business Test Truffle Carpaccio',
    slug: `test-truffle-carpaccio-${Date.now()}`,
    category: 'starters',
    price: 38.00,
    description: 'Fresh black truffles with prime carpaccio',
    isAvailable: true,
    rating: 4.8,
    reviewsCount: 0
  });

  assert.ok(testDish._id);
});

// ============================================================================
// 2. TRANSACTIONAL EMAIL NOTIFICATIONS & DELIVERY RETRY
// ============================================================================

test('EMAILS: Order placement triggers transactional notification in dev outbox and DB record', async () => {
  clearDevOutbox();

  // Place order as customer
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      customer: {
        name: customerUser.name,
        email: customerUser.email,
        phone: customerUser.phone || '+15551234567'
      },
      orderType: 'delivery',
      deliveryAddress: {
        street: '742 Evergreen Terrace',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      paymentMethod: 'cash',
      items: [{ menuItem: testDish._id, quantity: 1 }],
      notes: 'Please buzz apartment 4B'
    })
  });

  const orderJson = await orderRes.json();
  assert.strictEqual(orderRes.status, 201);
  const createdOrder = orderJson.data;

  // Check dev outbox
  const outbox = getDevOutbox();
  const orderEmail = outbox.find(m => m.subject.includes(createdOrder.orderNumber));
  assert.ok(orderEmail, 'Expected order placement email in dev outbox');
  assert.strictEqual(orderEmail.to, customerUser.email.toLowerCase());

  // Check Notification in DB
  const notificationRecord = await Notification.findOne({
    referenceId: createdOrder._id,
    type: 'order_placed'
  });
  assert.ok(notificationRecord);
  assert.strictEqual(notificationRecord.status, 'sent');
  assert.strictEqual(notificationRecord.deliveryAttempts, 1);
});

test('EMAILS: Admin can list notifications and retry failed deliveries', async () => {
  // Create a simulated failed notification record
  const failedRecord = await Notification.create({
    recipient: { email: 'test-failed@example.com', name: 'Test Failed Recipient' },
    type: 'custom',
    subject: 'Simulated Notification Retry Test',
    bodyHtml: '<p>Retry test content</p>',
    status: 'failed',
    deliveryAttempts: 1,
    maxAttempts: 3,
    errorLogs: [{ attempt: 1, error: 'Simulated SMTP connection timeout', timestamp: new Date() }]
  });

  // Admin lists notifications
  const listRes = await fetch(`${baseUrl}/api/notifications?limit=10`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const listJson = await listRes.json();
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listJson.data));
  assert.ok(listJson.pagination.totalItems > 0);

  // Admin retries the failed notification
  const retryRes = await fetch(`${baseUrl}/api/notifications/${failedRecord._id}/retry`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const retryJson = await retryRes.json();
  assert.strictEqual(retryRes.status, 200);
  assert.strictEqual(retryJson.success, true);

  // Verify DB state updated
  const updatedRecord = await Notification.findById(failedRecord._id);
  assert.strictEqual(updatedRecord.status, 'sent');
  assert.strictEqual(updatedRecord.deliveryAttempts, 2);
  assert.ok(updatedRecord.sentAt);
});

// ============================================================================
// 3. CUSTOMER REVIEWS FOR ELIGIBLE COMPLETED ORDERS
// ============================================================================

test('REVIEWS: Unpurchased dish review is rejected with 403 Forbidden', async () => {
  const reviewRes = await fetch(`${baseUrl}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      menuItemId: testDish._id,
      rating: 5,
      title: 'Amazing Truffles',
      comment: 'Delicious even though I never ordered it'
    })
  });

  const reviewJson = await reviewRes.json();
  assert.strictEqual(reviewRes.status, 403);
  assert.strictEqual(reviewJson.success, false);
  assert.match(reviewJson.message, /completed dining or delivery orders|completed.*order/i);
});

test('REVIEWS: Review succeeds for eligible completed order, prevents duplicates', async () => {
  // Create an explicit COMPLETED order for customer containing testDish
  testCompletedOrder = await Order.create({
    orderNumber: `SAV-CMP-${Math.floor(1000 + Math.random() * 9000)}`,
    user: customerUser.id,
    customer: {
      name: customerUser.name,
      email: customerUser.email,
      phone: customerUser.phone || '+15551234567'
    },
    items: [
      {
        menuItem: testDish._id,
        name: testDish.name,
        price: testDish.price,
        quantity: 1
      }
    ],
    status: 'completed',
    paymentStatus: 'paid',
    orderType: 'delivery',
    subtotal: testDish.price,
    tax: 3.14,
    deliveryFee: 0,
    totalAmount: 41.14
  });

  // Now submit review
  const reviewRes = await fetch(`${baseUrl}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      menuItemId: testDish._id,
      orderId: testCompletedOrder._id,
      rating: 5,
      title: 'Spectacular Gastronomy',
      comment: 'The carpaccio melted in our mouths. Outstanding aroma!'
    })
  });

  const reviewJson = await reviewRes.json();
  assert.strictEqual(reviewRes.status, 201);
  assert.strictEqual(reviewJson.success, true);
  assert.strictEqual(reviewJson.data.rating, 5);
  assert.strictEqual(reviewJson.data.isVerifiedPurchase, true);
  testReviewId = reviewJson.data._id;

  // Attempt duplicate review submission for the same dish
  const duplicateRes = await fetch(`${baseUrl}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      menuItemId: testDish._id,
      rating: 4,
      title: 'Second review attempt',
      comment: 'Should be rejected'
    })
  });

  const duplicateJson = await duplicateRes.json();
  assert.strictEqual(duplicateRes.status, 400);
  assert.match(duplicateJson.message, /already submitted a review|already reviewed/i);
});

// ============================================================================
// 4. ADMIN REVIEW MODERATION & DYNAMIC RATING RECALCULATION
// ============================================================================

test('REVIEWS: Admin moderates review status and recalculates dish ratings', async () => {
  // Admin lists all reviews
  const adminReviewsRes = await fetch(`${baseUrl}/api/reviews/admin`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminReviewsJson = await adminReviewsRes.json();
  assert.strictEqual(adminReviewsRes.status, 200);
  assert.ok(Array.isArray(adminReviewsJson.data));

  // Admin approves review
  const approveRes = await fetch(`${baseUrl}/api/reviews/${testReviewId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'approved' })
  });
  const approveJson = await approveRes.json();
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveJson.data.isApproved, true);
  assert.strictEqual(approveJson.data.status, 'approved');

  // Verify dish rating was dynamically updated
  const updatedDish = await MenuItem.findById(testDish._id);
  assert.strictEqual(updatedDish.rating, 5);
  assert.strictEqual(updatedDish.reviewsCount, 1);

  // Admin rejects review
  const rejectRes = await fetch(`${baseUrl}/api/reviews/${testReviewId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'rejected' })
  });
  assert.strictEqual(rejectRes.status, 200);

  // Verify dish rating recalculates when no approved reviews remain
  const dishAfterReject = await MenuItem.findById(testDish._id);
  assert.strictEqual(dishAfterReject.reviewsCount, 0);
});

// ============================================================================
// 5. COUPON CREATION, EXPIRY, AND USAGE LIMITS
// ============================================================================

test('COUPONS: Admin creates voucher, validates active, rejects expired and exhausted coupons', async () => {
  // 1. Create valid coupon
  const validCouponRes = await fetch(`${baseUrl}/api/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      code: 'TESTAUTUMN20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 50,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: 5
    })
  });
  assert.strictEqual(validCouponRes.status, 201);

  // Validate active coupon on order of $100 -> expect $20 discount
  const validateValidRes = await fetch(`${baseUrl}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'TESTAUTUMN20', orderAmount: 100 })
  });
  const validateValidJson = await validateValidRes.json();
  assert.strictEqual(validateValidRes.status, 200);
  assert.strictEqual(validateValidJson.data.discountAmount, 20);

  // Validate with order amount below minimum ($30 < $50 min)
  const validateMinRes = await fetch(`${baseUrl}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'TESTAUTUMN20', orderAmount: 30 })
  });
  assert.strictEqual(validateMinRes.status, 400);

  // 2. Create Expired Coupon
  await Coupon.create({
    code: 'TESTEXPIRED',
    discountType: 'fixed',
    discountValue: 15,
    minOrderAmount: 20,
    expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    usageLimit: 100
  });

  const validateExpiredRes = await fetch(`${baseUrl}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'TESTEXPIRED', orderAmount: 80 })
  });
  const validateExpiredJson = await validateExpiredRes.json();
  assert.strictEqual(validateExpiredRes.status, 400);
  assert.match(validateExpiredJson.message, /expired/i);

  // 3. Create Exhausted Limit Coupon
  await Coupon.create({
    code: 'TESTLIMIT',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 10,
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    usageLimit: 3,
    usageCount: 3 // already hit limit
  });

  const validateLimitRes = await fetch(`${baseUrl}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'TESTLIMIT', orderAmount: 50 })
  });
  const validateLimitJson = await validateLimitRes.json();
  assert.strictEqual(validateLimitRes.status, 400);
  assert.match(validateLimitJson.message, /usage limit reached/i);
});

// ============================================================================
// 6. RESTAURANT SETTINGS & HOMEPAGE BANNER PERSISTENCE
// ============================================================================

test('SETTINGS: Operating hours, concierge contact info, and homepage banner persist', async () => {
  // Update settings via admin
  const updateSettingsRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      restaurantName: 'SAVORIA Haute Cuisine NYC',
      contactEmail: 'concierge-desk@savoria.com',
      contactPhone: '+1 (212) 555-9988',
      operatingHours: {
        lunch: { active: true, open: '11:30', close: '15:00' },
        dinner: { active: true, open: '17:30', close: '23:30' },
        closedDays: ['Monday']
      },
      homepageBanner: {
        enabled: true,
        badge: 'Michelin Starred',
        text: 'White Truffle Season is Here — Limited Reservation Slots Open.',
        linkText: 'Reserve Experience',
        linkUrl: '/reservations'
      }
    })
  });

  const updateJson = await updateSettingsRes.json();
  assert.strictEqual(updateSettingsRes.status, 200);
  assert.strictEqual(updateJson.data.restaurantName, 'SAVORIA Haute Cuisine NYC');
  assert.strictEqual(updateJson.data.homepageBanner.badge, 'Michelin Starred');

  // Verify public retrieval of settings
  const publicSettingsRes = await fetch(`${baseUrl}/api/settings`);
  const publicSettingsJson = await publicSettingsRes.json();
  assert.strictEqual(publicSettingsRes.status, 200);
  assert.strictEqual(publicSettingsJson.data.contactEmail, 'concierge-desk@savoria.com');
  assert.strictEqual(publicSettingsJson.data.homepageBanner.linkText, 'Reserve Experience');
  assert.strictEqual(publicSettingsJson.data.homepageBanner.enabled, true);

  // Restore restaurantName for subsequent suites
  await fetch(`${baseUrl}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      restaurantName: 'SAVORIA Haute Cuisine',
      contactEmail: 'concierge@savoria.com'
    })
  });
});

// ============================================================================
// 7. ACCESSIBLE CONTACT FORM WITH SPAM PROTECTION
// ============================================================================

test('CONTACT: Honeypot silently discards bot spam, time-trap blocks rapid bots', async () => {
  // 1. Honeypot trap filled
  const honeypotRes = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bot Spammer',
      email: 'spambot@example.com',
      subject: 'Buy cheap seo rankings',
      message: 'Click this link immediately for cheap rankings',
      _hp_trap: 'http://spam-link.org' // filled honeypot trap
    })
  });
  // Expect silent return so bot is not alerted, but no message persisted
  assert.strictEqual(honeypotRes.status, 200);
  const honeypotMessage = await ContactMessage.findOne({ email: 'spambot@example.com' });
  assert.strictEqual(honeypotMessage, null, 'Honeypot submission must not persist to DB');

  // 2. Rapid bot time-trap: form submitted under 1.5 seconds
  const rapidRes = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rapid Bot',
      email: 'rapidbot@example.com',
      subject: 'Fast submission',
      message: 'Submitting instantly within 20ms',
      _hp_trap: '',
      _form_time: Date.now() - 300 // only 300ms since form loaded
    })
  });
  assert.strictEqual(rapidRes.status, 429);

  // 3. Legitimate user contact form submission
  clearDevOutbox();
  const legitimateRes = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Lady Eleanor Vance',
      email: 'patron-tester@example.com',
      phone: '+1 212 555 4321',
      subject: 'Private Dining Room Inquiry',
      message: 'We wish to reserve the private wine cellar room for an anniversary dinner of 12 guests next month.',
      _hp_trap: '',
      _form_time: Date.now() - 6000 // 6 seconds to fill form
    })
  });

  const legitimateJson = await legitimateRes.json();
  assert.strictEqual(legitimateRes.status, 201);
  assert.strictEqual(legitimateJson.data.subject, 'Private Dining Room Inquiry');

  // Verify acknowledgment email sent
  const outbox = getDevOutbox();
  const ackEmail = outbox.find(m => m.to === 'patron-tester@example.com');
  assert.ok(ackEmail, 'Expected acknowledgment email dispatched to contact sender');

  // Verify Admin can retrieve and update inquiry status
  const adminContactRes = await fetch(`${baseUrl}/api/contact`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminContactJson = await adminContactRes.json();
  assert.strictEqual(adminContactRes.status, 200);
  assert.ok(adminContactJson.data.length > 0);

  const contactId = legitimateJson.data._id;
  const updateStatusRes = await fetch(`${baseUrl}/api/contact/${contactId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'responded' })
  });
  const updateStatusJson = await updateStatusRes.json();
  assert.strictEqual(updateStatusRes.status, 200);
  assert.strictEqual(updateStatusJson.data.status, 'responded');
});

// ============================================================================
// 8. SEARCH ENGINE METADATA, DYNAMIC SITEMAP, AND ROBOTS
// ============================================================================

test('SEO: Dynamic XML sitemap and robots.txt are served correctly', async () => {
  // Test Sitemap XML
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
  assert.strictEqual(sitemapRes.status, 200);
  const sitemapContentType = sitemapRes.headers.get('content-type');
  assert.match(sitemapContentType, /xml/i);

  const sitemapText = await sitemapRes.text();
  assert.match(sitemapText, /<\?xml/);
  assert.match(sitemapText, /<urlset/);
  assert.match(sitemapText, /<loc>.*\/menu<\/loc>/);
  assert.match(sitemapText, /<loc>.*\/reservations<\/loc>/);
  assert.match(sitemapText, /<loc>.*\/privacy<\/loc>/);
  assert.match(sitemapText, /<loc>.*\/terms<\/loc>/);

  // Test Robots TXT
  const robotsRes = await fetch(`${baseUrl}/robots.txt`);
  assert.strictEqual(robotsRes.status, 200);
  const robotsContentType = robotsRes.headers.get('content-type');
  assert.match(robotsContentType, /text\/plain/i);

  const robotsText = await robotsRes.text();
  assert.match(robotsText, /User-agent: \*/);
  assert.match(robotsText, /Disallow: \/admin/);
  assert.match(robotsText, /Sitemap: .*\/sitemap\.xml/);
});
