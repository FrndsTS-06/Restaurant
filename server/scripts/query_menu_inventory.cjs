const mongoose = require('mongoose');

async function checkMenu() {
  await mongoose.connect('mongodb://127.0.0.1:27017/restaurantpro_db');
  const items = await mongoose.connection.collection('menuitems').find({}).toArray();
  
  console.log(`Total Menu Item Records in DB: ${items.length}`);
  const uniqueItems = new Map();
  for (const item of items) {
    if (!uniqueItems.has(item.name)) {
      uniqueItems.set(item.name, item);
    }
  }

  console.log(`\nUnique Menu Items Count: ${uniqueItems.size}`);
  const list = [];
  for (const [name, item] of uniqueItems.entries()) {
    list.push({
      id: item._id,
      name: item.name,
      category: item.category,
      price: item.price,
      currency: item.currency || 'INR',
      image: item.image,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      tags: item.tags,
      dietary: item.dietary
    });
  }
  console.log(JSON.stringify(list, null, 2));
  await mongoose.disconnect();
}

checkMenu().catch(err => {
  console.error(err);
  process.exit(1);
});
