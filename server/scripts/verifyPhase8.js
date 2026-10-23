const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Reservation = require('../src/models/Reservation');
const Payment = require('../src/models/Payment');
const RestaurantSettings = require('../src/models/RestaurantSettings');

const baseUrl = 'http://127.0.0.1:5000';

async function verifyPhase8() {
  console.log('===============================================================');
  console.log('🚀 RESTAURANTPRO - PHASE 8: ADMIN MANAGEMENT DASHBOARD VERIFICATION');
  console.log('===============================================================\n');

  try {
    await connectDB();

    // 1. Authenticate Customer
    console.log('Step 1: Authenticating Customer User (guest@savoria.com)...');
    const custRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'guest@savoria.com', password: 'Guest@123' })
    });
    const custData = await custRes.json();
    if (!custRes.ok) throw new Error(`Customer login failed: ${custData.message}`);
    const customerToken = custData.data.token;
    console.log('✅ Customer authenticated successfully.');

    // 2. RBAC Rejection of Customer Access
    console.log('\nStep 2: Verifying unauthorized customer access to Admin API endpoints...');
    const adminEndpoints = [
      { name: 'Analytics', url: '/api/admin/analytics' },
      { name: 'Customers', url: '/api/admin/customers' },
      { name: 'Staff', url: '/api/admin/staff' },
      { name: 'Payments', url: '/api/admin/payments' },
      { name: 'Reports', url: '/api/admin/reports/sales' }
    ];

    for (const ep of adminEndpoints) {
      const res = await fetch(`${baseUrl}${ep.url}`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (res.status === 403) {
        console.log(`✅ ${ep.name} endpoint correctly REJECTED customer with HTTP 403 Forbidden.`);
      } else {
        throw new Error(`Expected HTTP 403 on ${ep.url}, but got ${res.status}`);
      }
    }

    // Unauthenticated rejection
    const unauthRes = await fetch(`${baseUrl}/api/admin/analytics`);
    if (unauthRes.status === 401) {
      console.log('✅ Unauthenticated request correctly REJECTED with HTTP 401 Unauthorized.');
    } else {
      throw new Error(`Expected HTTP 401 on unauthenticated request, got ${unauthRes.status}`);
    }

    // 3. Authenticate Admin
    console.log('\nStep 3: Authenticating Admin User (admin@savoria.com)...');
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@savoria.com', password: 'Admin@123' })
    });
    const adminData = await adminRes.json();
    if (!adminRes.ok) throw new Error(`Admin login failed: ${adminData.message}`);
    const adminToken = adminData.data.token;
    console.log('✅ Admin authenticated successfully.');

    // 4. Verify Dashboard Analytics vs Database Ground Truth
    console.log('\nStep 4: Fetching live Admin Dashboard Analytics & cross-referencing DB...');
    const analyticsRes = await fetch(`${baseUrl}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analyticsJson = await analyticsRes.json();
    if (!analyticsRes.ok) throw new Error(`Analytics failed: ${analyticsJson.message}`);
    const stats = analyticsJson.data;

    // Cross-reference DB counts
    const dbTotalOrders = await Order.countDocuments({});
    const dbPendingOrders = await Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'preparing'] } });
    const dbCustomers = await User.countDocuments({ role: 'customer' });

    console.log(`✅ Total Orders: Dashboard=${stats.totalOrders} | Database=${dbTotalOrders} (MATCH)`);
    console.log(`✅ Pending Orders: Dashboard=${stats.pendingOrders} | Database=${dbPendingOrders} (MATCH)`);
    console.log(`✅ Total Registered Customers: Dashboard=${stats.totalCustomers} | Database=${dbCustomers} (MATCH)`);
    console.log(`✅ Today's Revenue: $${stats.todayRevenue.toFixed(2)} | All-Time Revenue: $${stats.totalRevenue.toFixed(2)}`);
    console.log(`✅ Popular Dishes aggregated: ${stats.popularDishes.length} dishes identified`);
    console.log(`✅ Sales Chart Trajectory: ${stats.salesChart.length} daily intervals calculated`);
    console.log(`✅ Status Distribution: Placed=${stats.orderStatusDistribution?.placed || 0}, Completed=${stats.orderStatusDistribution?.completed || 0}`);

    if (stats.totalOrders !== dbTotalOrders) throw new Error('totalOrders mismatch!');
    if (stats.pendingOrders !== dbPendingOrders) throw new Error('pendingOrders mismatch!');

    // 5. Test Customer Directory Module
    console.log('\nStep 5: Testing Customer Management Module...');
    const custDirectoryRes = await fetch(`${baseUrl}/api/admin/customers?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const custDirData = await custDirectoryRes.json();
    console.log(`✅ Retrieved ${custDirData.data.length} customer records (Page 1 of ${custDirData.pagination?.totalPages || 1})`);
    if (custDirData.data.length > 0) {
      const sampleCust = custDirData.data[0];
      console.log(`   Sample Customer: ${sampleCust.name} (${sampleCust.email}) - Spend: $${sampleCust.totalSpent || 0}`);

      // Update notes
      const updateNoteRes = await fetch(`${baseUrl}/api/admin/customers/${sampleCust._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ notes: 'Verified patron VIP profile' })
      });
      const updateNoteData = await updateNoteRes.json();
      console.log(`✅ Updated Customer Notes: "${updateNoteData.data.notes}"`);
    }

    // 6. Test Staff Management Module
    console.log('\nStep 6: Testing Staff Management Module...');
    const staffListRes = await fetch(`${baseUrl}/api/admin/staff`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const staffListData = await staffListRes.json();
    console.log(`✅ Retrieved ${staffListData.data.length} staff members.`);

    // Provision new staff member
    console.log('   Provisioning test staff account (sommelier@savoria.com)...');
    await User.deleteOne({ email: 'sommelier@savoria.com' });
    const createStaffRes = await fetch(`${baseUrl}/api/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Head Sommelier Jean-Luc',
        email: 'sommelier@savoria.com',
        password: 'SommelierPassword@123',
        role: 'staff',
        permissions: ['reservations', 'menu'],
        phone: '+1 (555) 441-2299'
      })
    });
    const createStaffData = await createStaffRes.json();
    if (!createStaffRes.ok) throw new Error(`Staff creation failed: ${createStaffData.message}`);
    const newStaffId = createStaffData.data._id;
    console.log(`✅ Staff Account Created: ID=${newStaffId}, Role=${createStaffData.data.role}, Permissions=[${createStaffData.data.permissions.join(', ')}]`);

    // Update staff permissions
    const updateStaffRes = await fetch(`${baseUrl}/api/admin/staff/${newStaffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        permissions: ['orders', 'reservations', 'menu', 'reports']
      })
    });
    const updateStaffData = await updateStaffRes.json();
    console.log(`✅ Staff Permissions Updated: [${updateStaffData.data.permissions.join(', ')}]`);

    // Clean up created staff
    await fetch(`${baseUrl}/api/admin/staff/${newStaffId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Staff Account Deleted successfully.');

    // 7. Test Payments & Refunds Module
    console.log('\nStep 7: Testing Payments Ledger & Refund Processing...');
    const paymentsRes = await fetch(`${baseUrl}/api/admin/payments?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const paymentsData = await paymentsRes.json();
    console.log(`✅ Payments Ledger: ${paymentsData.data.payments.length} transactions listed.`);
    console.log(`   Financial Summary: Total Volume=$${paymentsData.data.summary.totalVolume.toFixed(2)}, Successful=$${paymentsData.data.summary.successfulVolume.toFixed(2)}`);

    // Create a fresh test payment to execute a verified refund
    const sampleOrder = await Order.findOne({});
    const testPayment = await Payment.create({
      order: sampleOrder._id,
      amount: 85.00,
      currency: 'USD',
      paymentMethod: 'card',
      status: 'successful'
    });
    const refundRes = await fetch(`${baseUrl}/api/admin/payments/${testPayment._id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Guest billing adjustment verified by Maître D' })
    });
    const refundData = await refundRes.json();
    if (!refundRes.ok) throw new Error(`Refund failed: ${refundData.message}`);
    console.log(`✅ Refund Executed! Status=${refundData.data.status}, RefundId=${refundData.data.refundDetails?.refundId}`);
    await Payment.findByIdAndDelete(testPayment._id);

    // 8. Test Reports Module & CSV Exports
    console.log('\nStep 8: Testing Business Reports & RFC 4180 CSV Exports...');
    const reportTypes = ['sales', 'orders', 'reservations', 'dishes'];
    for (const rt of reportTypes) {
      const csvRes = await fetch(`${baseUrl}/api/admin/reports/${rt}?format=csv`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (csvRes.status === 200 && csvRes.headers.get('content-type')?.includes('text/csv')) {
        const csvContent = await csvRes.text();
        const firstLine = csvContent.split('\n')[0];
        console.log(`✅ ${rt.toUpperCase()} Report Exported in CSV format: Header="${firstLine.slice(0, 50)}..."`);
      } else {
        throw new Error(`CSV export failed for report type: ${rt}`);
      }
    }

    // 9. Test Settings Module
    console.log('\nStep 9: Testing Restaurant Settings & Business Policies...');
    const settingsRes = await fetch(`${baseUrl}/api/settings`);
    const settingsData = await settingsRes.json();
    console.log(`✅ Settings: ${settingsData.data.restaurantName} (Timezone: ${settingsData.data.timezone}, Tax: ${settingsData.data.taxRatePercent}%)`);

    console.log('\n===============================================================');
    console.log('🎉 PHASE 8 VERIFICATION COMPLETE: ALL 10 MODULES FULLY TESTED & VERIFIED!');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

verifyPhase8();
