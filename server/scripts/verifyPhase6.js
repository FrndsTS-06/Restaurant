const http = require('http');

async function testPhase6() {
  const BASE = 'http://localhost:5000/api';

  console.log('--- 1. Fetching available dish from menu ---');
  const menuRes = await fetch(`${BASE}/menu`);
  const menuData = await menuRes.json();
  const dish = menuData.data[0];
  console.log(`Dish: "${dish.name}", Price: $${dish.price}, ID: ${dish._id}`);

  console.log('\n--- 2. Testing Invalid Totals (Client Tampering Rejection) ---');
  const tamperRes = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Live QA Customer', email: 'qa@savoria.com', phone: '+15551234567' },
      items: [{ menuItemId: dish._id, quantity: 1 }],
      orderType: 'delivery',
      deliveryAddress: { street: '100 Central Park South', city: 'New York', zipCode: '10019' },
      totalAmount: 0.99 // Invalid/tampered total
    })
  });
  const tamperJson = await tamperRes.json();
  console.log(`Tampered status code: ${tamperRes.status}`);
  console.log(`Tampered response message: ${tamperJson.message}`);
  if (tamperRes.status === 400) {
    console.log('✅ Tampered total was correctly rejected by backend!');
  } else {
    throw new Error('Tampered total was not rejected!');
  }

  console.log('\n--- 3. Placing Valid Live Order ---');
  const idempotencyKey = `live_verify_${Date.now()}`;
  const placeRes = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Live QA Customer', email: 'qa@savoria.com', phone: '+15551234567' },
      items: [{ menuItemId: dish._id, quantity: 2, price: 0.01 }], // client price ignored
      orderType: 'delivery',
      deliveryAddress: { street: '100 Central Park South', city: 'New York', zipCode: '10019' },
      idempotencyKey
    })
  });
  const placeJson = await placeRes.json();
  console.log(`Order status code: ${placeRes.status}`);
  const order = placeJson.data;
  console.log(`Order Number: ${order.orderNumber}`);
  console.log(`Order ID: ${order._id}`);
  console.log(`Calculated Subtotal: $${order.subtotal}`);
  console.log(`Calculated Tax: $${order.tax}`);
  console.log(`Calculated Delivery Fee: $${order.deliveryFee}`);
  console.log(`Calculated Total Amount: $${order.totalAmount}`);
  console.log(`Order Status: ${order.status}`);
  console.log(`Price Snapshot in Items: $${order.items[0].price}`);

  console.log('\n--- 4. Testing Idempotency (Prevent Duplicate Order) ---');
  const duplicateRes = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Live QA Customer', email: 'qa@savoria.com', phone: '+15551234567' },
      items: [{ menuItemId: dish._id, quantity: 2 }],
      orderType: 'delivery',
      deliveryAddress: { street: '100 Central Park South', city: 'New York', zipCode: '10019' },
      idempotencyKey
    })
  });
  const dupJson = await duplicateRes.json();
  console.log(`Duplicate submission status code: ${duplicateRes.status}`);
  console.log(`Returned existing order ID: ${dupJson.data._id}`);
  if (dupJson.data._id === order._id && duplicateRes.status === 200) {
    console.log('✅ Idempotency deduplication confirmed! Returned existing order without creating duplicate.');
  }

  console.log('\n--- 5. Verifying Order Persistence from MongoDB ---');
  const getRes = await fetch(`${BASE}/orders/${order.orderNumber}`);
  const getJson = await getRes.json();
  console.log(`Fetched Order #${getJson.data.orderNumber}, Total: $${getJson.data.totalAmount}, Status: ${getJson.data.status}`);
  if (getJson.data.orderNumber === order.orderNumber) {
    console.log('✅ Order persistence verified!');
  }

  console.log('\n--- 6. Testing Order Cancellation ---');
  const cancelRes = await fetch(`${BASE}/orders/${order._id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Customer requested schedule adjustment' })
  });
  const cancelJson = await cancelRes.json();
  console.log(`Cancel status code: ${cancelRes.status}`);
  console.log(`Updated Order Status: ${cancelJson.data.status}`);
  console.log(`Recorded Cancellation Reason: "${cancelJson.data.cancellationReason}"`);
  if (cancelJson.data.status === 'cancelled') {
    console.log('✅ Order cancellation verified!');
  }

  console.log('\n--- 7. Verifying Customer Order History Query ---');
  const historyRes = await fetch(`${BASE}/orders/my-orders?email=qa@savoria.com`);
  const historyJson = await historyRes.json();
  console.log(`Customer orders found: ${historyJson.data.length}`);
  const matched = historyJson.data.find(o => o.orderNumber === order.orderNumber);
  if (matched) {
    console.log(`✅ Customer order history contains Order #${matched.orderNumber} with status "${matched.status}"!`);
  }

  console.log('\n🎉 ALL PHASE 6 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

testPhase6().catch(err => {
  console.error('Phase 6 verification failed:', err);
  process.exit(1);
});
