const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurantpro_db';

const APPROVED_3D_MODELS = {
  'A5 Miyazaki Wagyu Ribeye': {
    model3dUrl: '/models/food/a5-wagyu-ribeye.glb',
    modelStatus: 'available',
    modelAltText: 'Interactive 3D model of A5 Miyazaki Wagyu Ribeye with bone marrow jus and Norcia black truffle'
  },
  'Grand Cru Dark Chocolate Sphere': {
    model3dUrl: '/models/food/chocolate-sphere.glb',
    modelStatus: 'available',
    modelAltText: 'Interactive 3D model of Grand Cru Dark Chocolate Sphere with salted caramel ganache'
  },
  'Smoked Rosemary Old Fashioned': {
    model3dUrl: '/models/food/old-fashioned.glb',
    modelStatus: 'available',
    modelAltText: 'Interactive 3D model of Smoked Rosemary Old Fashioned cocktail in crystal rocks glass'
  },
  'Pan-Seared Hokkaido Scallops': {
    model3dUrl: '/models/food/pan-seared-scallops.glb',
    modelStatus: 'available',
    modelAltText: 'Interactive 3D model of Pan-Seared Hokkaido Scallops on cauliflower velouté'
  }
};

const PENDING_AND_MISSING_ASSETS = {
  'Wild Chilean Sea Bass': {
    model3dUrl: '',
    modelStatus: 'pending_approval',
    modelAltText: 'High-resolution culinary presentation of Wild Chilean Sea Bass with miso glaze'
  },
  'Wild Forest Truffle Tagliolini': {
    model3dUrl: '',
    modelStatus: 'in_development',
    modelAltText: 'Handcrafted bronze-die pasta with Parmigiano-Reggiano and shaved Norcia black truffle'
  },
  'Heirloom Burrata & Roasted Fig': {
    model3dUrl: '',
    modelStatus: 'pending_approval',
    modelAltText: 'Heirloom Burrata with aged Modena balsamic glaze and roasted figs'
  },
  'Hokkaido Scallop Crudo with Yuzu Kosho': {
    model3dUrl: '',
    modelStatus: 'pending_approval',
    modelAltText: 'Sashimi-grade Hokkaido scallops with finger lime pearls and shiso oil'
  },
  'Pan-Roasted Duck Breast à l’Orange': {
    model3dUrl: '',
    modelStatus: 'missing_asset',
    modelAltText: 'Pan-roasted heritage duck breast with orange gastrique reduction'
  },
  'Meyer Lemon & Yuzu Tart': {
    model3dUrl: '',
    modelStatus: 'in_development',
    modelAltText: 'Torched French meringue Meyer lemon and yuzu tart'
  },
  'Sparkling Hibiscus & Berry Mocktail': {
    model3dUrl: '',
    modelStatus: 'in_development',
    modelAltText: 'Effervescent wild hibiscus, crushed blackberries, and botanical sparkling water'
  }
};

async function migrateFoodAssets() {
  console.log('================================================================');
  console.log('  MIGRATING 3D FOOD ASSET METADATA TO RESTAURANTPRO_DB           ');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  const collection = mongoose.connection.collection('menuitems');

  const items = await collection.find({}).toArray();
  console.log(`Found ${items.length} total menu item records in database.\n`);

  let updatedCount = 0;
  for (const item of items) {
    let updateData = null;

    if (APPROVED_3D_MODELS[item.name]) {
      updateData = {
        model3dUrl: APPROVED_3D_MODELS[item.name].model3dUrl,
        modelPosterUrl: item.image,
        modelStatus: APPROVED_3D_MODELS[item.name].modelStatus,
        modelAltText: APPROVED_3D_MODELS[item.name].modelAltText
      };
    } else if (PENDING_AND_MISSING_ASSETS[item.name]) {
      updateData = {
        model3dUrl: PENDING_AND_MISSING_ASSETS[item.name].model3dUrl,
        modelPosterUrl: item.image,
        modelStatus: PENDING_AND_MISSING_ASSETS[item.name].modelStatus,
        modelAltText: PENDING_AND_MISSING_ASSETS[item.name].modelAltText
      };
    } else {
      // Dynamic fallback for any other custom test item (e.g. Kashmiri Saffron Korma)
      updateData = {
        model3dUrl: '',
        modelPosterUrl: item.image,
        modelStatus: 'pending_approval',
        modelAltText: `${item.name} signature culinary preparation`
      };
    }

    await collection.updateOne(
      { _id: item._id },
      { $set: updateData }
    );
    updatedCount++;
  }

  console.log(`Successfully migrated ${updatedCount} menu item records.`);

  // Audit sample check
  const samples = await collection.find({}).limit(5).toArray();
  console.log('\nSample records after migration:');
  samples.forEach(s => {
    console.log(`- [${s.modelStatus.toUpperCase()}] ${s.name}: 3D="${s.model3dUrl || 'None'}" Poster="${s.modelPosterUrl ? 'Set' : 'Missing'}"`);
  });

  await mongoose.disconnect();
}

migrateFoodAssets().catch(err => {
  console.error('Migration Error:', err);
  process.exit(1);
});
