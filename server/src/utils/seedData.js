const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');

// Import all models
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const RestaurantTable = require('../models/RestaurantTable');
const Coupon = require('../models/Coupon');
const RestaurantSettings = require('../models/RestaurantSettings');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

const categoriesData = [
  {
    name: 'Starters',
    slug: 'starters',
    description: 'Delicate veloutés, artisan crudo, and fresh seasonal antipasti.',
    image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=600&q=80',
    displayOrder: 1
  },
  {
    name: 'Mains',
    slug: 'mains',
    description: 'A5 Miyazaki Wagyu, wild Chilean sea bass, and handcrafted pastas.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    displayOrder: 2
  },
  {
    name: 'Desserts',
    slug: 'desserts',
    description: 'Decadent French patisserie, torched yuzu meringues, and chocolate spheres.',
    image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80',
    displayOrder: 3
  },
  {
    name: 'Beverages',
    slug: 'beverages',
    description: 'Small-batch oak-smoked cocktails and cold-pressed botanical elixirs.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    displayOrder: 4
  }
];

const menuItemsData = [
  {
    name: 'Pan-Seared Hokkaido Scallops',
    description: 'Caramelized cauliflower velouté, black winter truffle pearls, and crisped pancetta crumb.',
    category: 'Starters',
    price: 24.50,
    costPrice: 8.50,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    tags: ['Signature', 'Gluten-Free'],
    dietary: ['Gluten-Free'],
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 14,
    prepTimeMinutes: 15,
    calories: 340
  },
  {
    name: 'Heirloom Burrata & Roasted Fig',
    description: 'Aged Modena balsamic glaze, Sicilian pistachios, micro arugula, and grilled country levain.',
    category: 'Starters',
    price: 19.00,
    costPrice: 5.50,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?auto=format&fit=crop&w=800&q=80',
    tags: ['Vegetarian', 'Popular'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 22,
    prepTimeMinutes: 12,
    calories: 420
  },
  {
    name: 'A5 Miyazaki Wagyu Ribeye',
    description: 'Charred broccolini, bone marrow jus, smoked salt flakes, and potato mousseline.',
    category: 'Mains',
    price: 68.00,
    costPrice: 28.00,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    tags: ['Chef Special', 'Gluten-Free'],
    dietary: ['Gluten-Free'],
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 38,
    prepTimeMinutes: 25,
    calories: 780
  },
  {
    name: 'Wild Chilean Sea Bass',
    description: 'Miso-mirin glaze, baby bok choy, lemongrass dashi emulsion, and lotus crisp.',
    category: 'Mains',
    price: 44.00,
    costPrice: 16.00,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    tags: ['Chef Special', 'Seafood'],
    dietary: ['Dairy-Free', 'Gluten-Free'],
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 19,
    prepTimeMinutes: 20,
    calories: 520
  },
  {
    name: 'Wild Forest Truffle Tagliolini',
    description: 'Handcrafted bronze-die pasta, 36-month Parmigiano-Reggiano cream, shaved Norcia black truffle.',
    category: 'Mains',
    price: 36.00,
    costPrice: 10.00,
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80',
    tags: ['Handmade', 'Vegetarian'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 31,
    prepTimeMinutes: 18,
    calories: 610
  },
  {
    name: 'Grand Cru Dark Chocolate Sphere',
    description: 'Warm salted caramel ganache poured tableside, Madagascar vanilla bean gelato, and hazelnut praline.',
    category: 'Desserts',
    price: 16.50,
    costPrice: 4.00,
    image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80',
    tags: ['Decadent', 'Vegetarian'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 27,
    prepTimeMinutes: 10,
    calories: 550
  },
  {
    name: 'Meyer Lemon & Yuzu Tart',
    description: 'Torched French meringue, Sicilian pistachio crumb, and crystallised mint leaves.',
    category: 'Desserts',
    price: 14.00,
    costPrice: 3.50,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    tags: ['Citrus', 'Vegetarian'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.7,
    reviewsCount: 15,
    prepTimeMinutes: 8,
    calories: 380
  },
  {
    name: 'Smoked Rosemary Old Fashioned',
    description: 'Small-batch bourbon, demerara sugar syrup, aromatic bitters, smoked with white oak tableside.',
    category: 'Beverages',
    price: 18.00,
    costPrice: 4.50,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    tags: ['Artisanal Cocktail'],
    dietary: ['Vegan', 'Gluten-Free'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 42,
    prepTimeMinutes: 5,
    calories: 190
  },
  {
    name: 'Sparkling Hibiscus & Berry Mocktail',
    description: 'Cold-pressed wild hibiscus elixir, crushed blackberries, Sicilian lime, topped with elderflower soda.',
    category: 'Beverages',
    price: 12.00,
    costPrice: 2.50,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    tags: ['Zero-Proof', 'Refreshing'],
    dietary: ['Vegan', 'Gluten-Free'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 18,
    prepTimeMinutes: 5,
    calories: 110
  }
];

const tablesData = [
  { tableNumber: 'Table 1', capacity: 2, location: 'Window Alcove', status: 'available' },
  { tableNumber: 'Table 2', capacity: 4, location: 'Window Alcove', status: 'available' },
  { tableNumber: 'Table 3', capacity: 2, location: 'Main Dining Salon', status: 'available' },
  { tableNumber: 'Table 4', capacity: 4, location: 'Main Dining Salon', status: 'available' },
  { tableNumber: 'Table 5', capacity: 6, location: 'Main Dining Salon', status: 'available' },
  { tableNumber: 'Table 6 (Cellar)', capacity: 8, location: 'Sommelier Cellar Room', status: 'available' }
];

const couponsData = [
  {
    code: 'SAVORIA10',
    description: '10% privilege discount on fine dining courses',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 30,
    maxDiscountAmount: 50,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    usageLimit: 500
  },
  {
    code: 'CHEF25',
    description: '$25 tasting dinner discount on orders above $100',
    discountType: 'fixed',
    discountValue: 25,
    minOrderAmount: 100,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    usageLimit: 200
  }
];

const seedMongoDB = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding complete Phase 3 database...');

    // 1. Seed Categories
    await Category.deleteMany({});
    const insertedCategories = await Category.insertMany(categoriesData);
    console.log(`✅ Seeded ${insertedCategories.length} Categories`);

    // Map Category name to ObjectId
    const categoryMap = {};
    insertedCategories.forEach(c => {
      categoryMap[c.name] = c._id;
    });

    // 2. Seed Menu Items
    await MenuItem.deleteMany({});
    const menuWithRefs = menuItemsData.map(item => ({
      ...item,
      categoryRef: categoryMap[item.category] || null
    }));
    const insertedDishes = await MenuItem.insertMany(menuWithRefs);
    console.log(`✅ Seeded ${insertedDishes.length} Menu Items`);

    // 3. Seed Users
    await User.deleteMany({});
    const adminUser = await User.create({
      name: 'Chef Alexandre Moreau',
      email: 'admin@savoria.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 (212) 555-0199',
      address: { street: '450 Avenue Montaigne', city: 'New York', state: 'NY', zipCode: '10022' }
    });

    const guestUser = await User.create({
      name: 'Sophie Martin',
      email: 'guest@savoria.com',
      password: 'Guest@123',
      role: 'customer',
      phone: '+1 (555) 789-4321',
      address: { street: '740 Park Avenue', city: 'New York', state: 'NY', zipCode: '10021' }
    });

    const staffUser = await User.create({
      name: 'Laurent Vautrin',
      email: 'staff@savoria.com',
      password: 'Staff@123',
      role: 'staff',
      phone: '+1 (555) 654-9870'
    });
    console.log('✅ Seeded Users (Admin, Customer, Staff)');

    // 4. Seed Restaurant Tables
    await RestaurantTable.deleteMany({});
    const insertedTables = await RestaurantTable.insertMany(tablesData);
    console.log(`✅ Seeded ${insertedTables.length} Dining Tables`);

    // 5. Seed Coupons
    await Coupon.deleteMany({});
    await Coupon.insertMany(couponsData);
    console.log('✅ Seeded Coupons (SAVORIA10, CHEF25)');

    // 6. Seed Settings
    await RestaurantSettings.deleteMany({});
    await RestaurantSettings.create({
      restaurantName: 'SAVORIA Haute Cuisine',
      tagline: 'Transcendent Gastronomy & Seasonal Harvests',
      contactEmail: 'concierge@savoria.com',
      contactPhone: '+1 (212) 555-0840',
      taxRatePercent: 8.25,
      currency: 'INR',
      currencySymbol: '₹'
    });
    console.log('✅ Seeded Restaurant Settings');

    // 7. Seed Sample Orders with Payment
    await Order.deleteMany({});
    await Payment.deleteMany({});

    const sampleOrder1 = await Order.create({
      orderNumber: 'SAV-8491',
      user: guestUser._id,
      customer: {
        name: guestUser.name,
        email: guestUser.email,
        phone: guestUser.phone
      },
      items: [
        { menuItem: insertedDishes[0]._id, name: insertedDishes[0].name, price: insertedDishes[0].price, quantity: 2 },
        { menuItem: insertedDishes[2]._id, name: insertedDishes[2].name, price: insertedDishes[2].price, quantity: 1 }
      ],
      table: insertedTables[1]._id,
      tableNumber: 'Table 2',
      orderType: 'dine-in',
      subtotal: 117.00,
      tax: 9.65,
      totalAmount: 126.65,
      status: 'preparing',
      paymentStatus: 'paid'
    });

    const payment1 = await Payment.create({
      order: sampleOrder1._id,
      user: guestUser._id,
      amount: 126.65,
      currency: 'USD',
      paymentMethod: 'card',
      status: 'successful'
    });
    sampleOrder1.payment = payment1._id;
    await sampleOrder1.save();
    console.log('✅ Seeded Orders & Payments');

    // 8. Seed Table Reservations
    await Reservation.deleteMany({});
    await Reservation.create([
      {
        user: guestUser._id,
        table: insertedTables[0]._id,
        guestName: 'Eleanor Vance',
        guestEmail: 'eleanor@example.com',
        guestPhone: '+1 (555) 349-2918',
        guestsCount: 2,
        reservationDate: '2026-10-18',
        timeSlot: '19:30',
        tableNumber: 'Table 1',
        seatingArea: 'Window Alcove',
        status: 'confirmed',
        specialRequests: 'Celebrating wedding anniversary. Champagne on arrival.'
      },
      {
        user: null,
        table: insertedTables[3]._id,
        guestName: 'Lord Julian Sterling',
        guestEmail: 'julian@example.com',
        guestPhone: '+1 (555) 728-1940',
        guestsCount: 4,
        reservationDate: '2026-10-19',
        timeSlot: '20:00',
        tableNumber: 'Table 4',
        seatingArea: 'Main Dining Salon',
        status: 'confirmed',
        specialRequests: 'Gluten-free menu suggestions for two guests.'
      }
    ]);
    console.log('✅ Seeded Reservations');

    // 9. Seed Dish Reviews
    await Review.deleteMany({});
    await Review.create([
      {
        user: guestUser._id,
        menuItem: insertedDishes[2]._id, // Wagyu
        rating: 5,
        title: 'Life-changing beef preparation',
        comment: 'The marbling and the bone marrow reduction were beyond extraordinary. A masterclass in luxury dining.',
        isApproved: true
      },
      {
        user: guestUser._id,
        menuItem: insertedDishes[0]._id, // Scallops
        rating: 5,
        title: 'Perfect sear and truffle aroma',
        comment: 'The cauliflower velouté elevates the sweet Hokkaido scallops to another dimension.',
        isApproved: true
      }
    ]);
    console.log('✅ Seeded Dish Reviews');

    // 10. Seed AuditLog
    await AuditLog.deleteMany({});
    await AuditLog.create({
      user: adminUser._id,
      action: 'CREATE',
      entity: 'MenuItem',
      entityId: String(insertedDishes[2]._id),
      changes: { action: 'Database bootstrap initialization' },
      ipAddress: '127.0.0.1',
      userAgent: 'RestaurantPro Seed Engine'
    });
    console.log('✅ Seeded Initial Audit Log');

    console.log('\n🎉 ALL 12 MODELS SEEDED SUCCESSFULLY IN MONGODB!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedMongoDB();
}

module.exports = { seedMongoDB };
