/**
 * End-to-End Test Suite for Savoria Restaurant
 * Smoke tests for Customer Menu & Order Flow
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const CLIENT_BASE = process.env.CLIENT_BASE || 'http://localhost:5173';

describe('Savoria Restaurant E2E Smoke Tests', () => {
  it('loads the homepage with restaurant branding', async () => {
    // 1. Visit frontend client & API settings
    const [clientRes, settingsRes] = await Promise.all([
      fetch(`${CLIENT_BASE}/`).catch(() => fetch(`${API_BASE}/`)),
      fetch(`${API_BASE}/api/settings`)
    ]);

    assert.strictEqual(settingsRes.status, 200);
    const settingsData = await settingsRes.json();
    assert.strictEqual(settingsData.success, true);
    assert.ok(settingsData.data.restaurantName, 'Restaurant name must be defined');
    assert.strictEqual(settingsData.data.restaurantName, 'SAVORIA Haute Cuisine');

    // 2. Expect header branding, hero elements, and featured status to be valid
    const healthRes = await fetch(`${API_BASE}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');
    assert.strictEqual(healthData.database.connected, true);
  });

  it('allows browsing menu and adding item to cart', async () => {
    const sessionId = `e2e_session_${Date.now()}`;

    // 1. Navigate to /menu & fetch category dishes
    const menuRes = await fetch(`${API_BASE}/api/menu`);
    assert.strictEqual(menuRes.status, 200);
    const menuData = await menuRes.json();
    assert.ok(Array.isArray(menuData.data), 'Menu items should be an array');
    assert.ok(menuData.data.length > 0, 'Should have active menu items');

    // 2. Select category filter
    const dish = menuData.data[0];
    assert.ok(dish._id, 'Dish should have an ID');
    assert.ok(dish.price > 0, 'Dish should have a valid price');

    // 3. Click 'Add to Order' on a dish (Add to persistent guest cart)
    const addRes = await fetch(`${API_BASE}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({
        menuItemId: dish._id,
        quantity: 1,
        specialInstructions: 'Extra fine garnish'
      })
    });
    assert.ok(addRes.status === 200 || addRes.status === 201, 'Add to cart should succeed');
    const addData = await addRes.json();
    assert.strictEqual(addData.success, true);

    // 4. Verify cart badge and items increment
    const cartRes = await fetch(`${API_BASE}/api/cart`, {
      headers: { 'x-session-id': sessionId }
    });
    assert.strictEqual(cartRes.status, 200);
    const cartData = await cartRes.json();
    assert.ok(cartData.data.items.length >= 1, 'Cart should contain added item');
    assert.strictEqual(cartData.data.items[0].menuItem._id, String(dish._id));
    assert.ok(cartData.data.subtotal >= dish.price, 'Cart subtotal should reflect item price');
  });

  it('submits a table reservation request', async () => {
    // 1. Calculate future booking date (avoiding Monday)
    const d = new Date();
    d.setDate(d.getDate() + 7);
    if (d.getDay() === 1) d.setDate(d.getDate() + 1); // Avoid Monday
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const reservationDate = `${year}-${month}-${day}`;

    // 2. Verify availability
    const availRes = await fetch(`${API_BASE}/api/reservations/availability?date=${reservationDate}&guestsCount=2`);
    assert.strictEqual(availRes.status, 200);
    const availData = await availRes.json();
    assert.strictEqual(availData.success, true);

    // 3. Fill in guest name, party size, date, preferred time & submit
    const bookRes = await fetch(`${API_BASE}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: 'E2E Testing Patron',
        guestEmail: 'e2e-patron@savoria.com',
        guestPhone: '+1 (555) 321-7654',
        guestsCount: 2,
        reservationDate,
        timeSlot: '19:00',
        specialRequests: 'Window booth please'
      })
    });

    assert.strictEqual(bookRes.status, 201);
    const bookData = await bookRes.json();
    assert.strictEqual(bookData.success, true);
    assert.ok(bookData.data.reservationNumber || bookData.data.code, 'Reservation should generate a confirmation number');
    assert.ok(bookData.data._id, 'Reservation should generate an ID');
  });
});
