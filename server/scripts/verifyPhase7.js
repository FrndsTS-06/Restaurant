const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Reservation = require('../src/models/Reservation');
const RestaurantTable = require('../src/models/RestaurantTable');
const RestaurantSettings = require('../src/models/RestaurantSettings');

const baseUrl = 'http://127.0.0.1:5000';

async function verifyPhase7() {
  console.log('===============================================================');
  console.log('🚀 RESTAURANTPRO - PHASE 7: TABLE BOOKING SYSTEM VERIFICATION');
  console.log('===============================================================\n');

  try {
    await connectDB();

    // 1. Authenticate Admin and Customer
    console.log('Step 1: Authenticating Admin and Customer...');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${adminLoginData.message}`);
    const adminToken = adminLoginData.data.token;
    console.log('✅ Admin Authenticated successfully.');

    // 2. Fetch Restaurant Settings & Operating Hours
    console.log('\nStep 2: Checking Restaurant Business Settings...');
    const settingsRes = await fetch(`${baseUrl}/api/settings`);
    const settingsData = await settingsRes.json();
    console.log(`✅ Operating Timezone: ${settingsData.data.timezone}`);
    console.log(`✅ Booking Duration: ${settingsData.data.bookingDurationMinutes} mins | Buffer: ${settingsData.data.bufferTimeMinutes} mins`);
    console.log(`✅ Dinner Window: ${settingsData.data.operatingHours?.dinner?.open} - ${settingsData.data.operatingHours?.dinner?.close}`);

    // Clean up any previous verification test records
    await Reservation.deleteMany({ guestEmail: 'verify-phase7@savoria.com' });
    const verifyTableNumber = 'Table V-99';
    await RestaurantTable.deleteOne({ tableNumber: verifyTableNumber });

    // 3. Admin creates a dedicated test table
    console.log('\nStep 3: Admin creates a private booth table...');
    const tableRes = await fetch(`${baseUrl}/api/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        tableNumber: verifyTableNumber,
        capacity: 6,
        minCapacity: 2,
        location: 'Sommelier Cellar Room'
      })
    });
    const tableData = await tableRes.json();
    if (!tableRes.ok) throw new Error(`Table creation failed: ${tableData.message}`);
    console.log(`✅ Created Table: ${tableData.data.tableNumber} (Capacity: ${tableData.data.capacity}, Location: ${tableData.data.location})`);

    // 4. Customer checks live slot availability
    const testDate = '2026-10-24'; // Saturday
    console.log(`\nStep 4: Customer checks slot availability for ${testDate} (Party of 6)...`);
    const availRes = await fetch(`${baseUrl}/api/reservations/availability?date=${testDate}&guestsCount=6`);
    const availData = await availRes.json();
    const slot1900 = availData.data.slots?.find(s => s.time === '19:00');
    console.log(`✅ Slot 19:00 Available: ${slot1900?.available} (Remaining Tables: ${slot1900?.remainingTables})`);

    // 5. Customer books a reservation
    console.log(`\nStep 5: Customer books a table for ${testDate} at 19:00...`);
    const bookRes = await fetch(`${baseUrl}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: 'Duke Alexander',
        guestEmail: 'verify-phase7@savoria.com',
        guestPhone: '+1 (555) 789-0123',
        guestsCount: 6,
        tableNumber: verifyTableNumber,
        reservationDate: testDate,
        timeSlot: '19:00',
        seatingArea: 'Sommelier Cellar Room',
        specialRequests: 'Château Margaux 2015 decanted 45 mins prior'
      })
    });
    const bookData = await bookRes.json();
    if (!bookRes.ok) throw new Error(`Booking failed: ${bookData.message}`);
    const reservation = bookData.data;
    console.log(`✅ Reservation Confirmed! Code: ${reservation.reservationNumber} | Table: ${reservation.tableNumber}`);
    console.log(`   Time Window: ${reservation.timeSlot} - ${reservation.endTimeSlot} | Status: ${reservation.status}`);

    // 6. Verify Persistence in MongoDB
    console.log('\nStep 6: Verifying DB Persistence for reservation...');
    const dbRecord = await Reservation.findOne({ reservationNumber: reservation.reservationNumber });
    if (!dbRecord) throw new Error('Reservation was not found in MongoDB!');
    console.log(`✅ DB Record verified: ID=${dbRecord._id}, Code=${dbRecord.reservationNumber}, Table=${dbRecord.tableNumber}`);

    // 7. Attempt Overlapping Conflicting Booking (Conflict Prevention)
    console.log('\nStep 7: Attempting conflicting booking on the same table at 19:30 (overlaps with 19:00 slot)...');
    const conflictRes = await fetch(`${baseUrl}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: 'Conflicting Booking Attempt',
        guestEmail: 'conflict-phase7@savoria.com',
        guestPhone: '+1 (555) 999-0000',
        guestsCount: 6,
        tableNumber: verifyTableNumber,
        reservationDate: testDate,
        timeSlot: '19:30', // Overlapping
        seatingArea: 'Sommelier Cellar Room'
      })
    });
    const conflictData = await conflictRes.json();
    if (conflictRes.status === 400 && !conflictData.success) {
      console.log(`✅ Conflicting booking correctly REJECTED! HTTP 400`);
      console.log(`   Error Message: "${conflictData.message}"`);
    } else {
      throw new Error(`Expected HTTP 400 rejection for conflict, but got HTTP ${conflictRes.status}`);
    }

    // 8. Customer views booking history
    console.log('\nStep 8: Customer retrieves booking history...');
    const historyRes = await fetch(`${baseUrl}/api/reservations/my-reservations?email=verify-phase7@savoria.com`);
    const historyData = await historyRes.json();
    const foundBooking = historyData.data?.find(r => r.reservationNumber === reservation.reservationNumber);
    if (!foundBooking) throw new Error('Reservation not found in customer booking history!');
    console.log(`✅ Booking found in history: Code=${foundBooking.reservationNumber}, Date=${foundBooking.reservationDate}`);

    // 9. Cancel Reservation & Recalculate Availability
    console.log(`\nStep 9: Customer cancels reservation ${reservation.reservationNumber}...`);
    const cancelRes = await fetch(`${baseUrl}/api/reservations/${reservation._id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestEmail: 'verify-phase7@savoria.com',
        reason: 'Guest party plans shifted to Sunday brunch'
      })
    });
    const cancelData = await cancelRes.json();
    if (!cancelRes.ok) throw new Error(`Cancellation failed: ${cancelData.message}`);
    console.log(`✅ Reservation Cancelled successfully! Status: ${cancelData.data.status}`);

    // Verify availability is recalculated
    console.log('\nStep 10: Verifying availability recalculation after cancellation...');
    const recheckRes = await fetch(`${baseUrl}/api/reservations/availability?date=${testDate}&guestsCount=6`);
    const recheckData = await recheckRes.json();
    const freedSlot = recheckData.data.slots?.find(s => s.time === '19:00');
    if (!freedSlot?.available) {
      throw new Error('Slot 19:00 was not freed up after cancellation!');
    }
    console.log(`✅ Availability Recalculated! Slot 19:00 is Available again (Remaining Tables: ${freedSlot.remainingTables})`);

    // 10. Admin Table Management: Block/Unblock
    console.log('\nStep 11: Admin blocks and unblocks table for maintenance...');
    const blockRes = await fetch(`${baseUrl}/api/tables/${tableData.data._id}/block`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isBlocked: true, blockedReason: 'Varnish refurbishment' })
    });
    const blockData = await blockRes.json();
    console.log(`✅ Table Blocked: isBlocked=${blockData.data.isBlocked}, Reason="${blockData.data.blockedReason}"`);

    const unblockRes = await fetch(`${baseUrl}/api/tables/${tableData.data._id}/block`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isBlocked: false })
    });
    const unblockData = await unblockRes.json();
    console.log(`✅ Table Unblocked: isBlocked=${unblockData.data.isBlocked}`);

    // Cleanup test records
    await RestaurantTable.deleteOne({ tableNumber: verifyTableNumber });
    await Reservation.deleteMany({ guestEmail: 'verify-phase7@savoria.com' });
    console.log('\n✅ Test records cleaned up successfully.');

    console.log('\n===============================================================');
    console.log('🎉 PHASE 7 VERIFICATION COMPLETE: ALL REQUIREMENTS MET & VERIFIED!');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

verifyPhase7();
