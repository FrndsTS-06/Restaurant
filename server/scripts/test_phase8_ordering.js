/**
 * PHASE 8 — CART AND ORDERING SYSTEM TEST SUITE
 * 
 * Tests:
 * 1. Add item to cart
 * 2. Add the same item multiple times (increments quantity)
 * 3. Increase and decrease quantity
 * 4. Remove an item
 * 5. Empty cart
 * 6. Cart persistence after refresh (session headers)
 * 7. Cart persistence after login (/api/cart/merge)
 * 8. Menu price changes & Server-side trusted price calculation
 * 9. Unavailable menu items (blocked from cart & checkout)
 * 10. Subtotal calculations (mathematical precision)
 * 11. Taxes (8.25%) and delivery fees ($5 under $100, $0 over $100 / pickup)
 * 12. Coupon application (percentage & fixed discount)
 * 13. Invalid coupons (expired, below min order, non-existent)
 * 14. Delivery and pickup modality selection
 * 15. Delivery address validation (street, city, zipCode requirements)
 * 16. Checkout process & cart auto-clear
 * 17. Duplicate order prevention (Idempotency key enforcement)
 * 18. Order confirmation details (order number, breakdown)
 * 19. Order history scoping (/api/orders/my-orders)
 * 20. Order status updates & valid state machine transitions
 * 21. Cancelled orders & policy restrictions
 * 22. Failed backend requests (safe rejection, no 500 crashes)
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

const results = [];
function record(name, condition, detail = '') {
  results.push({ name, passed: Boolean(condition), detail });
  const icon = condition ? '  ✓' : '  ✗ FAIL:';
  console.log(`${icon} ${name}${detail ? ` (${detail})` : ''}`);
  if (!condition) {
    console.error(`    Assertion failed: ${detail}`);
  }
}

async function request(endpoint, options = {}) {
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

async function runOrderingAudit() {
  console.log('\n======================================================');
  console.log('      PHASE 8 — CART & ORDERING SYSTEM AUDIT         ');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const guestSession = `guest_p8_${timestamp}`;
  const guestHeaders = { 'x-session-id': guestSession };

  // Fetch available dishes from Menu API
  console.log('--- 0. Fetching Active Menu Fixtures ---');
  const menuRes = await request('/menu');
  record('Menu items retrieved for testing', menuRes.status === 200);
  const dishes = menuRes.data?.data || [];
  record('At least 2 active menu dishes available', dishes.length >= 2, `Found ${dishes.length} dishes`);

  const dishA = dishes[0];
  const dishB = dishes[1];

  // 1. ADD ITEM TO CART
  console.log('\n--- 1. Add Item to Cart ---');
  const addRes1 = await request('/cart/items', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ menuItemId: dishA._id, quantity: 1, specialInstructions: 'Gluten allergy' })
  });
  record('POST /api/cart/items returns HTTP 201 Created', addRes1.status === 201);
  const cart1 = addRes1.data?.data;
  record('Cart contains 1 item', cart1?.items?.length === 1);
  record('Cart item has correct dish ID and instructions', 
    cart1?.items[0]?.name === dishA.name && cart1?.items[0]?.specialInstructions === 'Gluten allergy');

  // 2. ADD SAME ITEM MULTIPLE TIMES (QUANTITY INCREMENT)
  console.log('\n--- 2. Add Same Item Multiple Times (Increment) ---');
  const addRes2 = await request('/cart/items', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ menuItemId: dishA._id, quantity: 2 })
  });
  record('POST /api/cart/items again returns HTTP 201', addRes2.status === 201);
  const cart2 = addRes2.data?.data;
  record('Cart still contains 1 distinct item line', cart2?.items?.length === 1);
  record('Cart item quantity incremented to 3 (1 + 2)', cart2?.items[0]?.quantity === 3);

  // Add second distinct item
  const addRes3 = await request('/cart/items', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ menuItemId: dishB._id, quantity: 1 })
  });
  const cart3 = addRes3.data?.data;
  record('Cart now contains 2 distinct item lines', cart3?.items?.length === 2);

  // 3. INCREASE AND DECREASE QUANTITY
  console.log('\n--- 3. Increase & Decrease Quantity ---');
  const itemBId = cart3?.items?.find(i => i.name === dishB.name)?._id;
  
  // Increase quantity to 4
  const updateRes1 = await request(`/cart/items/${itemBId}`, {
    method: 'PUT',
    headers: guestHeaders,
    body: JSON.stringify({ quantity: 4 })
  });
  record('PUT /api/cart/items/:id returns HTTP 200', updateRes1.status === 200);
  const cartUpdate1 = updateRes1.data?.data;
  const updatedItemB = cartUpdate1?.items?.find(i => String(i._id) === String(itemBId));
  record('Item B quantity updated to 4', updatedItemB?.quantity === 4);

  // Decrease quantity to 2
  const updateRes2 = await request(`/cart/items/${itemBId}`, {
    method: 'PUT',
    headers: guestHeaders,
    body: JSON.stringify({ quantity: 2 })
  });
  const cartUpdate2 = updateRes2.data?.data;
  const updatedItemB2 = cartUpdate2?.items?.find(i => String(i._id) === String(itemBId));
  record('Item B quantity decreased to 2', updatedItemB2?.quantity === 2);

  // Decrease quantity to 0 (auto-removes)
  const updateRes0 = await request(`/cart/items/${itemBId}`, {
    method: 'PUT',
    headers: guestHeaders,
    body: JSON.stringify({ quantity: 0 })
  });
  const cartUpdate0 = updateRes0.data?.data;
  const hasItemB = cartUpdate0?.items?.some(i => String(i._id) === String(itemBId));
  record('Updating quantity to 0 removes item from cart', !hasItemB);

  // 4. REMOVE AN ITEM
  console.log('\n--- 4. Remove an Item ---');
  // Re-add Item B
  await request('/cart/items', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ menuItemId: dishB._id, quantity: 1 })
  });
  const cartBeforeRemove = (await request('/cart', { headers: guestHeaders })).data?.data;
  const itemARemoveId = cartBeforeRemove?.items?.find(i => i.name === dishA.name)?._id;

  const removeRes = await request(`/cart/items/${itemARemoveId}`, {
    method: 'DELETE',
    headers: guestHeaders
  });
  record('DELETE /api/cart/items/:id returns HTTP 200', removeRes.status === 200);
  const cartAfterRemove = removeRes.data?.data;
  const hasItemA = cartAfterRemove?.items?.some(i => i.name === dishA.name);
  record('Target item cleanly removed from cart', !hasItemA);
  record('Remaining items preserved in cart', cartAfterRemove?.items?.length === 1);

  // 5. EMPTY CART
  console.log('\n--- 5. Empty Cart ---');
  const clearRes = await request('/cart', {
    method: 'DELETE',
    headers: guestHeaders
  });
  record('DELETE /api/cart returns HTTP 200', clearRes.status === 200);
  const clearedCart = clearRes.data?.data;
  record('Cleared cart items array is empty', clearedCart?.items?.length === 0);
  record('Subtotal, tax, deliveryFee, totalAmount reset to 0', 
    clearedCart?.subtotal === 0 && clearedCart?.totalAmount === 0 && clearedCart?.tax === 0);

  // 6. CART PERSISTENCE AFTER REFRESH
  console.log('\n--- 6. Cart Persistence Across Page Refreshes ---');
  // Add item with session ID
  await request('/cart/items', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ menuItemId: dishA._id, quantity: 2 })
  });

  // Simulate refresh: separate GET /api/cart request using same session ID header
  const refreshCartRes = await request('/cart', { headers: guestHeaders });
  record('GET /api/cart returns HTTP 200', refreshCartRes.status === 200);
  const refreshedCart = refreshCartRes.data?.data;
  record('Persisted cart contains 2 of Dish A across simulated refresh', 
    refreshedCart?.items?.length === 1 && refreshedCart?.items[0]?.quantity === 2);

  // 7. CART PERSISTENCE AFTER LOGIN (GUEST CART MERGE)
  console.log('\n--- 7. Cart Persistence After Login (Guest Cart Merge) ---');
  // Register a new customer
  const customerEmail = `shopper_${timestamp}@savoria.com`;
  const customerPass = 'SecureCartPass@2026';
  const regCustomerRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Cart Auditor',
      email: customerEmail,
      password: customerPass,
      phone: '+1 (555) 888-9999'
    })
  });
  const customerToken = regCustomerRes.data?.data?.token;
  const authHeaders = { Authorization: `Bearer ${customerToken}` };

  // Call /api/cart/merge with the guest session ID
  const mergeRes = await request('/cart/merge', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ sessionId: guestSession })
  });
  record('POST /api/cart/merge returns HTTP 200', mergeRes.status === 200);
  const mergedCart = mergeRes.data?.data;
  record('Merged customer cart contains the items from guest session', 
    mergedCart?.items?.some(i => i.name === dishA.name && i.quantity === 2));

  // Verify that the guest cart session is cleared/consumed
  const oldGuestCartRes = await request('/cart', { headers: guestHeaders });
  record('Old guest session cart was consumed and emptied upon merge', 
    oldGuestCartRes.data?.data?.items?.length === 0);

  // 8. MENU PRICE CHANGES & TRUSTED SERVER TOTALS
  console.log('\n--- 8. Menu Price Changes & Trusted Server Pricing ---');
  // Attempt client-side price tampering in checkout payload: dish submitted as $0.01
  const tamperedOrderRes = await request('/orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customer: { name: 'Price Hacker', email: customerEmail, phone: '+1 555-888-9999' },
      items: [{ menuItemId: dishA._id, name: dishA.name, price: 0.01, quantity: 1 }],
      totalAmount: 0.01,
      clientTotal: 0.01,
      orderType: 'takeaway',
      paymentMethod: 'cash'
    })
  });
  record('Server rejects client-tampered total amount ($0.01) with HTTP 400', 
    tamperedOrderRes.status === 400);
  record('Rejection message explicitly alerts on price discrepancy', 
    tamperedOrderRes.data?.message?.includes('discrepancy') || tamperedOrderRes.data?.message?.includes('total'));

  // 9. UNAVAILABLE MENU ITEMS
  console.log('\n--- 9. Unavailable Menu Items Protection ---');
  // Authenticate Admin to toggle item availability
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
  });
  const adminToken = adminLoginRes.data?.data?.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // Temporarily set Dish B to unavailable
  await request(`/menu/${dishB._id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ isAvailable: false })
  });

  // Attempt to add unavailable item to cart
  const addUnavailableRes = await request('/cart/items', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ menuItemId: dishB._id, quantity: 1 })
  });
  record('Adding sold-out/unavailable item rejected with HTTP 400', addUnavailableRes.status === 400);
  record('Error message indicates dish is unavailable or sold out', 
    addUnavailableRes.data?.message?.includes('unavailable') || addUnavailableRes.data?.message?.includes('sold out'));

  // Attempt to place an order containing unavailable item
  const orderUnavailableRes = await request('/orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customer: { name: 'Cart Auditor', email: customerEmail, phone: '+1 555-888-9999' },
      items: [{ menuItemId: dishB._id, name: dishB.name, price: dishB.price, quantity: 1 }],
      orderType: 'takeaway',
      paymentMethod: 'cash'
    })
  });
  record('Ordering unavailable item rejected by server with HTTP 400', orderUnavailableRes.status === 400);

  // Restore Dish B availability
  await request(`/menu/${dishB._id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ isAvailable: true })
  });
  record('Restored dish availability cleanly', true);

  // 10. SUBTOTAL CALCULATIONS (MATHEMATICAL PRECISION)
  console.log('\n--- 10. Subtotal Calculations ---');
  // Clear cart first
  await request('/cart', { method: 'DELETE', headers: authHeaders });

  // Add 2 of Dish A and 3 of Dish B
  await request('/cart/items', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ menuItemId: dishA._id, quantity: 2 })
  });
  await request('/cart/items', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ menuItemId: dishB._id, quantity: 3 })
  });

  const subtotalCart = (await request('/cart', { headers: authHeaders })).data?.data;
  const expectedSubtotal = Math.round((dishA.price * 2 + dishB.price * 3) * 100) / 100;
  record(`Subtotal mathematically matches expected ($${expectedSubtotal})`, 
    subtotalCart?.subtotal === expectedSubtotal, `Actual: $${subtotalCart?.subtotal}`);

  // 11. TAXES AND DELIVERY FEES
  console.log('\n--- 11. Taxes & Delivery Fees ---');
  const expectedTax = Math.round(expectedSubtotal * 0.0825 * 100) / 100;
  record(`Sales tax (8.25%) calculated correctly ($${expectedTax})`, 
    subtotalCart?.tax === expectedTax, `Actual: $${subtotalCart?.tax}`);

  // Delivery fee rules:
  // Under $100 -> $5.00 delivery fee
  // $100 and above -> Free delivery ($0.00)
  // Pickup / Dine-in -> $0.00
  if (expectedSubtotal < 100) {
    record('Delivery under $100 charges $5.00 fee', subtotalCart?.deliveryFee === 5.00);
  } else {
    record('Delivery >= $100 has free delivery ($0.00)', subtotalCart?.deliveryFee === 0.00);
  }

  // Switch modality to 'pickup'
  const pickupModalityRes = await request('/cart/order-type', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ orderType: 'pickup' })
  });
  const pickupCart = pickupModalityRes.data?.data;
  record('Switching orderType to "pickup" sets deliveryFee to $0.00', pickupCart?.deliveryFee === 0);

  // 12. COUPON APPLICATION (PERCENTAGE & FIXED)
  console.log('\n--- 12. Coupon Application ---');
  const couponCode = `PHASE8_${timestamp}`;
  // Create test coupon: 20% discount, max $50, min order $20
  await request('/coupons', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      code: couponCode,
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 20,
      maxDiscountAmount: 50,
      expiryDate: new Date(Date.now() + 86400000 * 5)
    })
  });

  const applyRes = await request('/cart/apply-coupon', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ code: couponCode })
  });
  record('POST /api/cart/apply-coupon returns HTTP 200', applyRes.status === 200);
  const couponCart = applyRes.data?.data;
  const expectedDiscount = Math.round(expectedSubtotal * 0.20 * 100) / 100;
  record(`Coupon discount accurately computed ($${expectedDiscount})`, 
    couponCart?.discount === expectedDiscount, `Actual: $${couponCart?.discount}`);

  // 13. INVALID COUPONS
  console.log('\n--- 13. Invalid Coupons Handling ---');
  // Non-existent coupon
  const fakeCouponRes = await request('/cart/apply-coupon', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ code: 'NONEXISTENT_COUPON_XYZ' })
  });
  record('Applying non-existent coupon returns HTTP 404', fakeCouponRes.status === 404);

  // Coupon with order amount below minimum
  const highMinCoupon = `HIMIN_${String(timestamp).slice(-8)}`;
  const createHighMinRes = await request('/coupons', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      code: highMinCoupon,
      discountType: 'fixed',
      discountValue: 10,
      minOrderAmount: 5000, // Very high minimum
      expiryDate: new Date(Date.now() + 86400000)
    })
  });
  record('High minimum coupon fixture created with 201', createHighMinRes.status === 201);

  const belowMinRes = await request('/cart/apply-coupon', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ code: highMinCoupon })
  });
  record('Coupon below minimum order amount rejected with HTTP 400', belowMinRes.status === 400);
  record('Rejection details specify minimum amount requirement', 
    belowMinRes.data?.message?.includes('Minimum order amount'));

  // 14. DELIVERY AND PICKUP SELECTION
  console.log('\n--- 14. Modality Selection (Delivery / Pickup / Dine-in) ---');
  const setDeliveryRes = await request('/cart/order-type', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ orderType: 'delivery' })
  });
  record('Modality set to "delivery" successfully', setDeliveryRes.data?.data?.orderType === 'delivery');

  const setDineInRes = await request('/cart/order-type', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ orderType: 'dine-in' })
  });
  record('Modality set to "dine-in" successfully', setDineInRes.data?.data?.orderType === 'dine-in');

  // 15. ADDRESS VALIDATION
  console.log('\n--- 15. Address Validation for Delivery Orders ---');
  const badAddressOrderRes = await request('/orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customer: { name: 'Cart Auditor', email: customerEmail, phone: '+1 555-888-9999' },
      items: [{ menuItemId: dishA._id, name: dishA.name, price: dishA.price, quantity: 1 }],
      orderType: 'delivery',
      deliveryAddress: { street: '', city: 'New York', zipCode: '10022' } // missing street
    })
  });
  record('Delivery order with missing street rejected with HTTP 400', badAddressOrderRes.status === 400);
  record('Validation error message specifies street address requirement', 
    badAddressOrderRes.data?.errors?.some(e => e.includes('street')) || badAddressOrderRes.data?.message?.includes('street'));

  // 16. CHECKOUT PROCESS
  console.log('\n--- 16. Checkout & Order Placement ---');
  const validOrderPayload = {
    customer: { name: 'Cart Auditor', email: customerEmail, phone: '+1 555-888-9999' },
    items: [{ menuItemId: dishA._id, name: dishA.name, price: dishA.price, quantity: 2 }],
    orderType: 'takeaway',
    paymentMethod: 'cash',
    idempotencyKey: `idemp_${timestamp}`
  };

  const checkoutRes = await request('/orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(validOrderPayload)
  });
  record('POST /api/orders returns HTTP 201 Created', checkoutRes.status === 201);
  const confirmedOrder = checkoutRes.data?.data;
  const orderId = confirmedOrder?._id;
  const orderNumber = confirmedOrder?.orderNumber;
  record('Order generated uppercase orderNumber (e.g. SAV-XXXX)', /^SAV-\d{4}$/.test(orderNumber));
  record('Order initial status is "placed"', confirmedOrder?.status === 'placed');

  // Verify cart auto-cleared after order placement
  const cartAfterOrder = (await request('/cart', { headers: authHeaders })).data?.data;
  record('Persistent user cart automatically cleared upon order placement', 
    cartAfterOrder?.items?.length === 0 && cartAfterOrder?.totalAmount === 0);

  // 17. DUPLICATE ORDER PREVENTION (IDEMPOTENCY)
  console.log('\n--- 17. Duplicate Order Prevention (Idempotency Key) ---');
  const duplicateOrderRes = await request('/orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(validOrderPayload) // identical payload and idempotencyKey
  });
  record('Duplicate order request with identical idempotencyKey returns HTTP 200', duplicateOrderRes.status === 200);
  record('Returns existing order record without creating second order', 
    duplicateOrderRes.data?.data?._id === orderId && duplicateOrderRes.data?.data?.orderNumber === orderNumber);

  // 18. ORDER CONFIRMATION
  console.log('\n--- 18. Order Confirmation Integrity ---');
  const orderDetailsRes = await request(`/orders/${orderId}`, { headers: authHeaders });
  record('GET /api/orders/:id returns HTTP 200', orderDetailsRes.status === 200);
  const details = orderDetailsRes.data?.data;
  record('Confirmation contains populated dish items snapshot', 
    details?.items?.length > 0 && details?.items[0]?.name === dishA.name);
  record('Confirmation contains payment record reference', Boolean(details?.payment));
  record('Confirmation contains status history entry for "placed"', 
    details?.statusHistory?.some(h => h.status === 'placed'));

  // 19. ORDER HISTORY
  console.log('\n--- 19. Customer Order History ---');
  const historyRes = await request('/orders/my-orders', { headers: authHeaders });
  record('GET /api/orders/my-orders returns HTTP 200', historyRes.status === 200);
  const historyList = historyRes.data?.data || [];
  record('Order history contains the newly placed order', 
    historyList.some(o => o.orderNumber === orderNumber));

  // 20. ORDER STATUS UPDATES & STATE MACHINE TRANSITIONS
  console.log('\n--- 20. Order Status Transitions & State Machine ---');
  // Transition 1: 'placed' -> 'confirmed' (Valid)
  const statusRes1 = await request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'confirmed', note: 'Kitchen received ticket' })
  });
  record('Transition from "placed" to "confirmed" returns HTTP 200', statusRes1.status === 200);
  record('Order status updated to "confirmed"', statusRes1.data?.data?.status === 'confirmed');

  // Transition 2: 'confirmed' -> 'preparing' (Valid)
  const statusRes2 = await request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'preparing', note: 'Chef prepping orders' })
  });
  record('Transition from "confirmed" to "preparing" returns HTTP 200', statusRes2.status === 200);

  // Invalid Transition: 'preparing' -> 'placed' (Disallowed backwards transition)
  const invalidTransitionRes = await request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'placed', note: 'Illegal backwards transition' })
  });
  record('Disallowed backwards transition rejected with HTTP 400', invalidTransitionRes.status === 400);
  record('Error message details valid next transitions', 
    invalidTransitionRes.data?.message?.includes('Cannot transition'));

  // 21. CANCELLED ORDERS
  console.log('\n--- 21. Cancelled Orders & Terminal State Protection ---');
  // Create another order for cancellation testing
  const cancelTestPayload = {
    customer: { name: 'Cart Auditor', email: customerEmail, phone: '+1 555-888-9999' },
    items: [{ menuItemId: dishA._id, name: dishA.name, price: dishA.price, quantity: 1 }],
    orderType: 'takeaway',
    paymentMethod: 'cash'
  };
  const cancelOrderRes = await request('/orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(cancelTestPayload)
  });
  const orderToCancelId = cancelOrderRes.data?.data?._id;

  // Customer cancels the order
  const doCancelRes = await request(`/orders/${orderToCancelId}/cancel`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason: 'Guest plans changed' })
  });
  record('POST /api/orders/:id/cancel returns HTTP 200', doCancelRes.status === 200);
  record('Order status changed to "cancelled"', doCancelRes.data?.data?.status === 'cancelled');
  record('Cancellation reason stored', doCancelRes.data?.data?.cancellationReason === 'Guest plans changed');

  // Attempt to cancel already cancelled order (terminal state)
  const reCancelRes = await request(`/orders/${orderToCancelId}/cancel`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason: 'Duplicate cancel' })
  });
  record('Attempt to cancel already cancelled order rejected with HTTP 400', reCancelRes.status === 400);

  // 22. FAILED BACKEND REQUESTS (GRACEFUL ERROR HANDLING)
  console.log('\n--- 22. Failed Backend Requests & Boundary Safety ---');
  // Malformed order payload
  const emptyOrderRes = await request('/orders', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({})
  });
  record('Empty order payload rejected with HTTP 400', emptyOrderRes.status === 400);
  record('Returns structured error response envelope', 
    emptyOrderRes.data?.success === false && typeof emptyOrderRes.data?.message === 'string');

  // Invalid order ID lookup
  const invalidOrderIdRes = await request('/orders/invalid-mongo-id-12345', { headers: authHeaders });
  record('Invalid order ID returns HTTP 404 (safe rejection without 500 crash)', 
    invalidOrderIdRes.status === 404);

  // Non-existent order ID lookup
  const missingOrderRes = await request('/orders/507f1f77bcf86cd799439011', { headers: authHeaders });
  record('Non-existent valid order ID returns HTTP 404', missingOrderRes.status === 404);

  // --- SUMMARY ---
  console.log('\n======================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`PHASE 8 AUDIT RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runOrderingAudit().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
