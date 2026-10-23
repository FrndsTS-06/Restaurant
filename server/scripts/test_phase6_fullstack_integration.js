import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import MenuItem from '../src/models/MenuItem.js';
import Order from '../src/models/Order.js';
import Payment from '../src/models/Payment.js';
import Coupon from '../src/models/Coupon.js';
import RestaurantSettings from '../src/models/RestaurantSettings.js';
import Reservation from '../src/models/Reservation.js';
import RestaurantTable from '../src/models/RestaurantTable.js';

const BASE_URL = 'http://localhost:5000/api';

const results = [];
function record(title, passed, detail = '') {
  results.push({ title, passed, detail });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${title}${detail ? ` (${detail})` : ''}`);
  if (!passed) console.error(`   Assertion Failure: ${detail}`);
}

async function runPhase6FullStackAudit() {
  console.log('========================================================================');
  console.log('   PHASE 6: FULL-STACK INTEGRATION & DATABASE VERIFICATION AUDIT');
  console.log('========================================================================\n');

  await connectDB();

  let adminToken = '';
  let customerToken = '';
  let createdDishId = null;
  let testOrderId = null;
  let testReservationId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. ADMIN AUTHORIZATION & ROLE ACCESS CONTROL
    // -------------------------------------------------------------------------
    console.log('--- 1. Admin Authorization & Security ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData?.data?.token;

    record('Admin Authentication', adminLoginRes.status === 200 && adminLoginData.data.user.role === 'admin', `Role: ${adminLoginData?.data?.user?.role}`);

    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
    });
    const customerLoginData = await customerLoginRes.json();
    customerToken = customerLoginData?.data?.token;

    record('Customer Authentication', customerLoginRes.status === 200 && customerLoginData.data.user.role === 'customer');

    // Unauthenticated request to admin route
    const unauthRes = await fetch(`${BASE_URL}/admin/analytics`);
    record('Unauthenticated access blocked with 401', unauthRes.status === 401);

    // Customer token accessing admin route
    const custAdminRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    record('Customer forbidden from admin analytics with 403', custAdminRes.status === 403);

    // -------------------------------------------------------------------------
    // 2. MENU PRICING IN INR (ADMIN CONFIGURED vs CUSTOMER VISIBILITY)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Menu Pricing in INR (Admin <-> Customer Match) ---');
    const newDishPayload = {
      name: `Kashmiri Saffron Korma ${Date.now()}`,
      description: 'Slow-braised with organic Kashmiri saffron and crushed pistachios.',
      category: 'Mains',
      price: 850.00,
      costPrice: 280.00,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      tags: ['Chef Special', 'Gluten-Free']
    };

    // Admin creates dish
    const createDishRes = await fetch(`${BASE_URL}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(newDishPayload)
    });
    const createDishData = await createDishRes.json();
    record('Admin creates dish with INR ₹850 price', createDishRes.status === 201 && createDishData.data.price === 850);
    createdDishId = createDishData.data._id;

    // Direct MongoDB verification
    const dbDish = await MenuItem.findById(createdDishId);
    record('Dish persists directly in MongoDB', dbDish && dbDish.price === 850, `DB Price: ₹${dbDish?.price}`);

    // Customer public API queries menu
    const publicMenuRes = await fetch(`${BASE_URL}/menu?limit=100`);
    const publicMenuData = await publicMenuRes.json();
    const customerViewDish = publicMenuData.data.find(d => d._id === createdDishId);
    record('Customer sees exact admin-configured price in INR', customerViewDish && customerViewDish.price === 850, `Public Price: ₹${customerViewDish?.price}`);

    // Admin updates price to ₹950 and flags as featured
    const updateDishRes = await fetch(`${BASE_URL}/menu/${createdDishId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ price: 950.00, isFeatured: true })
    });
    const updateDishData = await updateDishRes.json();
    record('Admin updates dish price to ₹950', updateDishRes.status === 200 && updateDishData.data.price === 950);

    // Customer public API verifies instant price sync
    const publicMenuRes2 = await fetch(`${BASE_URL}/menu/${createdDishId}`);
    const publicMenuData2 = await publicMenuRes2.json();
    record('Customer immediately sees updated price ₹950 after edit', publicMenuData2.data.price === 950);

    // -------------------------------------------------------------------------
    // 3. SERVER-SIDE ORDER TOTAL & PRICING INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Server-Side Order Calculations & Anti-Tampering ---');
    // Client attempts to submit fake price / tampered total
    const tamperRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Audit Patron', email: 'audit@savoria.com', phone: '+91 98765 43210' },
        items: [{ menuItemId: createdDishId, quantity: 2, price: 5.00 }], // client attempts ₹5 instead of ₹950
        orderType: 'delivery',
        deliveryAddress: { street: '12 Marine Drive', city: 'Mumbai', zipCode: '400020' },
        totalAmount: 15.00 // fake total
      })
    });
    const tamperData = await tamperRes.json();
    record('Server rejects client-tampered total amount with 400 Bad Request', tamperRes.status === 400);

    // Place legitimate order with server calculating totals
    const validOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        customer: { name: 'Audit Patron', email: 'audit@savoria.com', phone: '+91 98765 43210' },
        items: [{ menuItemId: createdDishId, quantity: 2 }],
        orderType: 'delivery',
        deliveryAddress: { street: '12 Marine Drive', city: 'Mumbai', zipCode: '400020' }
      })
    });
    const validOrderData = await validOrderRes.json();
    testOrderId = validOrderData.data._id;
    const order = validOrderData.data;

    // Mathematical verification:
    // Subtotal = 950 * 2 = 1900.00
    // Tax (8.25%) = 1900 * 0.0825 = 156.75
    // Delivery fee = subtotal >= 100 ? 0 : 5.00 -> 0
    // Total = 1900 + 156.75 = 2056.75
    record('Server calculates accurate subtotal (2 x ₹950 = ₹1900)', order.subtotal === 1900, `Subtotal: ₹${order.subtotal}`);
    record('Server calculates accurate 8.25% sales tax (₹156.75)', Math.abs(order.tax - 156.75) < 0.01, `Tax: ₹${order.tax}`);
    record('Server calculates correct total amount (₹2056.75)', Math.abs(order.totalAmount - 2056.75) < 0.01, `Total: ₹${order.totalAmount}`);
    record('Order explicitly uses INR currency', order.currency === 'INR', `Currency: ${order.currency}`);

    // Verify order in MongoDB
    const dbOrder = await Order.findById(testOrderId);
    record('Order persists in MongoDB with complete item snapshot & INR', dbOrder && dbOrder.currency === 'INR' && dbOrder.items[0].price === 950);

    // -------------------------------------------------------------------------
    // 4. COUPON & DISCOUNT CALCULATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Coupon & Discount Calculations ---');
    const couponRes = await fetch(`${BASE_URL}/coupons`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const couponData = await couponRes.json();
    const activeCoupon = couponData?.data?.find(c => c.code === 'SAVORIA10');
    record('Admin coupons retrieved (SAVORIA10 exists)', !!activeCoupon, `Code: ${activeCoupon?.code}, Discount: ${activeCoupon?.discountValue}%`);

    // Public coupon validation endpoint (Tests percentage & max discount cap)
    const validateCouponRes = await fetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVORIA10', orderAmount: 1000 })
    });
    const validateCouponData = await validateCouponRes.json();
    record('Public coupon validation verifies 10% discount capped at max ₹50', validateCouponRes.status === 200 && validateCouponData.data.discountAmount === 50, `Discount: ₹${validateCouponData?.data?.discountAmount}`);

    // Test without hitting cap (10% of ₹400 = ₹40)
    const validateCouponRes2 = await fetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVORIA10', orderAmount: 400 })
    });
    const validateCouponData2 = await validateCouponRes2.json();
    record('Public coupon validation verifies exact 10% on ₹400 (₹40)', validateCouponRes2.status === 200 && validateCouponData2.data.discountAmount === 40, `Discount: ₹${validateCouponData2?.data?.discountAmount}`);

    // -------------------------------------------------------------------------
    // 5. PAYMENT API & INR TRANSACTION VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Payment API & Transaction Records in INR ---');
    const dbPayment = await Payment.findOne({ order: testOrderId });
    record('Payment record created for order', !!dbPayment);
    record('Payment amount matches order total in INR', dbPayment && Math.abs(dbPayment.amount - 2056.75) < 0.01 && dbPayment.currency === 'INR', `Amount: ₹${dbPayment?.amount}, Currency: ${dbPayment?.currency}`);

    // Test Razorpay create-order API
    const createPaymentRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ orderId: testOrderId })
    });
    const createPaymentData = await createPaymentRes.json();
    record('Razorpay payment gateway initialized in INR', createPaymentRes.status === 200 && createPaymentData.data.currency === 'INR', `Currency: ${createPaymentData?.data?.currency}, Amount(Paise): ${createPaymentData?.data?.amount}`);

    // -------------------------------------------------------------------------
    // 6. ORDER MANAGEMENT & STATUS WORKFLOW (ADMIN)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Order Management & Status Transitions ---');
    const transitions = [
      { next: 'confirmed', label: 'placed -> confirmed' },
      { next: 'preparing', label: 'confirmed -> preparing' },
      { next: 'ready', label: 'preparing -> ready' },
      { next: 'completed', label: 'ready -> completed' }
    ];

    for (const t of transitions) {
      const stepRes = await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: t.next, note: `Audited transition to ${t.next}` })
      });
      record(`Order status transition: ${t.label}`, stepRes.status === 200);
    }

    // Invalid backwards transition from completed
    const invalidStepRes = await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'preparing' })
    });
    record('Terminal state rejects backwards transition with 400 Bad Request', invalidStepRes.status === 400);

    // -------------------------------------------------------------------------
    // 7. RESTAURANT SETTINGS & PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Restaurant Settings & Configuration Persistence ---');
    const settingsRes = await fetch(`${BASE_URL}/settings`);
    const settingsData = await settingsRes.json();
    record('Settings retrieved with INR configuration', settingsRes.status === 200 && settingsData.data.currency === 'INR', `Currency: ${settingsData?.data?.currency}, Symbol: ${settingsData?.data?.currencySymbol}`);

    // Admin updates settings
    const updateSettingsRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ tagline: 'Epicurean Gastronomy & Seasonal Alchemy' })
    });
    const updateSettingsData = await updateSettingsRes.json();
    record('Admin updates restaurant settings', updateSettingsRes.status === 200 && updateSettingsData.data.tagline === 'Epicurean Gastronomy & Seasonal Alchemy');

    // Verify settings persist in MongoDB
    const dbSettings = await RestaurantSettings.findOne();
    record('Settings changes persist in MongoDB', dbSettings && dbSettings.tagline === 'Epicurean Gastronomy & Seasonal Alchemy');

    // -------------------------------------------------------------------------
    // 8. REVENUE ANALYTICS & ADMIN METRICS
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Admin Revenue Analytics & Statistics ---');
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    record('Admin revenue analytics retrieved', analyticsRes.status === 200 && analyticsData.data.totalOrders !== undefined, `Total Orders: ${analyticsData?.data?.totalOrders}, Total Revenue: ₹${analyticsData?.data?.totalRevenue}`);

    // -------------------------------------------------------------------------
    // 9. TABLE RESERVATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Table Reservations ---');
    const availRes = await fetch(`${BASE_URL}/reservations/availability?date=2026-10-29&guestsCount=2`);
    const availData = await availRes.json();
    record('Live reservation availability queried', availRes.status === 200 && Array.isArray(availData.data.slots));

    const bookRes = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        guestName: 'Audit Guest',
        guestEmail: 'auditguest@savoria.com',
        guestPhone: '+91 91234 56789',
        guestsCount: 2,
        reservationDate: '2026-10-29',
        timeSlot: '19:30',
        seatingArea: 'Window Alcove'
      })
    });
    const bookData = await bookRes.json();
    testReservationId = bookData?.data?._id;
    record('Customer successfully books table reservation', bookRes.status === 201 && bookData.data.status === 'confirmed', `Number: ${bookData?.data?.reservationNumber}`);

    // Admin updates reservation status to seated
    const seatRes = await fetch(`${BASE_URL}/reservations/${testReservationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'seated' })
    });
    record('Admin seats reservation guest', seatRes.status === 200);

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Test Fixture Cleanup ---');
    if (createdDishId) await MenuItem.findByIdAndDelete(createdDishId);
    if (testOrderId) {
      await Order.findByIdAndDelete(testOrderId);
      await Payment.deleteMany({ order: testOrderId });
    }
    if (testReservationId) await Reservation.findByIdAndDelete(testReservationId);
    console.log('✅ Temporary test records cleaned up from MongoDB');

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('\n========================================================================');
    console.log(`   FULL-STACK AUDIT COMPLETE: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('========================================================================\n');

    return { totalTests, passedTests, failedTests, results };
  } catch (err) {
    console.error('❌ Full-Stack Integration Audit Error:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

runPhase6FullStackAudit();
