const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurantpro_db';

async function migrate() {
  console.log('🔄 Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Update RestaurantSettings
  const settingsResult = await db.collection('restaurantsettings').updateMany(
    {},
    { $set: { currency: 'INR', currencySymbol: '₹' } }
  );
  console.log(`✅ RestaurantSettings updated: ${settingsResult.modifiedCount} records set to currency: 'INR', symbol: '₹'`);

  // 2. Preserve Historical Orders
  const orderWithoutCurrency = await db.collection('orders').countDocuments({ currency: { $exists: false } });
  console.log(`📦 Historical orders without explicit currency field: ${orderWithoutCurrency}`);
  if (orderWithoutCurrency > 0) {
    const orderResult = await db.collection('orders').updateMany(
      { currency: { $exists: false } },
      { $set: { currency: 'USD' } }
    );
    console.log(`✅ Historical orders preserved with currency: 'USD': ${orderResult.modifiedCount}`);
  }

  // 3. Preserve Historical Payments
  const paymentsWithoutCurrency = await db.collection('payments').countDocuments({ currency: { $exists: false } });
  console.log(`💳 Historical payments without explicit currency field: ${paymentsWithoutCurrency}`);
  if (paymentsWithoutCurrency > 0) {
    const payResult = await db.collection('payments').updateMany(
      { currency: { $exists: false } },
      { $set: { currency: 'USD' } }
    );
    console.log(`✅ Historical payments preserved with currency: 'USD': ${payResult.modifiedCount}`);
  }

  // 4. Update Coupon Descriptions
  const coupons = await db.collection('coupons').find({}).toArray();
  let updatedCoupons = 0;
  for (const coupon of coupons) {
    if (coupon.description && coupon.description.includes('$')) {
      const newDesc = coupon.description.replace(/\$/g, '₹');
      await db.collection('coupons').updateOne(
        { _id: coupon._id },
        { $set: { description: newDesc } }
      );
      updatedCoupons++;
    }
  }
  console.log(`🎟️ Coupon descriptions sanitized from $ to ₹: ${updatedCoupons}`);

  // Summary verification
  const settings = await db.collection('restaurantsettings').findOne({});
  console.log('📋 Current Active Settings:', {
    restaurantName: settings.restaurantName,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol
  });

  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
