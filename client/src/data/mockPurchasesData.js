/**
 * Mock Data for Purchases & Procurement Management (Phase 3)
 * Provides realistic luxury culinary suppliers, ingredient catalog,
 * and initial purchase order records for SAVORIA Haute Cuisine.
 */

export const MOCK_SUPPLIERS = [
  {
    id: 'SUP-001',
    name: 'Miyazaki Wagyu Guild',
    specialty: 'A5 Kuroge Washu Beef & Premium Marrow',
    contactPerson: 'Kenji Takahashi',
    email: 'orders@miyazaki-guild.jp',
    phone: '+81 3 5555 0192',
    address: '4-12 Ginza, Chuo-ku, Tokyo, Japan',
    openingBalance: 45000.00,
    paymentTerms: 'Net 30',
    taxId: 'JP-94820193'
  },
  {
    id: 'SUP-002',
    name: 'Hokkaido Marine Direct',
    specialty: 'Jumbo Diver Scallops & Fresh Sea Urchin',
    contactPerson: 'Hiroshi Sato',
    email: 'sales@hokkaido-marine.jp',
    phone: '+81 11 234 5678',
    address: 'Pier 7, Otaru Port, Hokkaido, Japan',
    openingBalance: 18500.00,
    paymentTerms: 'Net 15',
    taxId: 'JP-10928374'
  },
  {
    id: 'SUP-003',
    name: 'Périgord Truffle & Fungi Co.',
    specialty: 'Black Winter Truffles & Wild Foraged Morels',
    contactPerson: 'Jean-Luc Moreau',
    email: 'orders@perigord-truffles.fr',
    phone: '+33 5 53 01 23 45',
    address: 'Route des Truffières, 24200 Sarlat, France',
    openingBalance: 62000.00,
    paymentTerms: 'Due on Receipt',
    taxId: 'FR-88392019'
  },
  {
    id: 'SUP-004',
    name: 'Valrhona Grand Cru Chocolates',
    specialty: 'Single-Origin Cacao & Pastry Callets',
    contactPerson: 'Sophie Bernard',
    email: 'b2b@valrhona-gastronomy.fr',
    phone: '+33 4 75 07 90 90',
    address: '14 Avenue du Président Roosevelt, Tain-l\'Hermitage, France',
    openingBalance: 12000.00,
    paymentTerms: 'Net 30',
    taxId: 'FR-55492810'
  },
  {
    id: 'SUP-005',
    name: 'Domaine Royale Cellar Selections',
    specialty: 'Grand Cru Bordeaux & Rare Japanese Whiskies',
    contactPerson: 'Henri de Saint-Germain',
    email: 'cellar@domaineroyale.fr',
    phone: '+33 3 80 51 00 11',
    address: 'Place Carnot, 21200 Beaune, France',
    openingBalance: 95000.00,
    paymentTerms: 'Net 60',
    taxId: 'FR-33291048'
  },
  {
    id: 'SUP-006',
    name: 'Organic Kyoto Botanical Farms',
    specialty: 'Shiso Leaves, Edible Flowers & Microgreens',
    contactPerson: 'Aoi Tanaka',
    email: 'contact@kyotobotanicals.jp',
    phone: '+81 75 801 4455',
    address: 'Kitayama Botanical Preserve, Kyoto, Japan',
    openingBalance: 4200.00,
    paymentTerms: 'Net 15',
    taxId: 'JP-66728190'
  }
];

export const MOCK_PRODUCTS = [
  {
    id: 'PROD-001',
    name: 'A5 Miyazaki Wagyu Tenderloin',
    sku: 'WAG-A5-KG',
    category: 'Mains & Meats',
    unit: 'kg',
    defaultPurchasePrice: 8500.00,
    preferredSupplierId: 'SUP-001',
    minOrderQty: 1
  },
  {
    id: 'PROD-002',
    name: 'Hokkaido Jumbo Diver Scallops',
    sku: 'SCL-HOK-KG',
    category: 'Starters & Seafood',
    unit: 'kg',
    defaultPurchasePrice: 3200.00,
    preferredSupplierId: 'SUP-002',
    minOrderQty: 2
  },
  {
    id: 'PROD-003',
    name: 'Fresh Black Winter Périgord Truffles',
    sku: 'TRF-WIN-G',
    category: 'Specialty & Fungi',
    unit: 'g',
    defaultPurchasePrice: 180.00,
    preferredSupplierId: 'SUP-003',
    minOrderQty: 50
  },
  {
    id: 'PROD-004',
    name: 'Valrhona Guanaja 70% Dark Chocolate Callets',
    sku: 'CHO-VAL-70',
    category: 'Desserts & Pastry',
    unit: 'kg',
    defaultPurchasePrice: 1450.00,
    preferredSupplierId: 'SUP-004',
    minOrderQty: 5
  },
  {
    id: 'PROD-005',
    name: 'Madagascar Bourbon Vanilla Pods (Pack of 25)',
    sku: 'VAN-MAD-25',
    category: 'Pastry & Spices',
    unit: 'pack',
    defaultPurchasePrice: 2800.00,
    preferredSupplierId: 'SUP-004',
    minOrderQty: 1
  },
  {
    id: 'PROD-006',
    name: 'A5 Wagyu Bone Marrow Bones',
    sku: 'BMR-WAG-KG',
    category: 'Mains & Meats',
    unit: 'kg',
    defaultPurchasePrice: 1200.00,
    preferredSupplierId: 'SUP-001',
    minOrderQty: 3
  },
  {
    id: 'PROD-007',
    name: 'Château Margaux Premier Grand Cru Classé (750ml)',
    sku: 'WIN-MRG-750',
    category: 'Beverages & Cellar',
    unit: 'bottle',
    defaultPurchasePrice: 42000.00,
    preferredSupplierId: 'SUP-005',
    minOrderQty: 1
  },
  {
    id: 'PROD-008',
    name: 'Suntory Hibiki 21 Year Old Whisky (700ml)',
    sku: 'WHS-HIB-21',
    category: 'Beverages & Spirits',
    unit: 'bottle',
    defaultPurchasePrice: 38000.00,
    preferredSupplierId: 'SUP-005',
    minOrderQty: 1
  },
  {
    id: 'PROD-009',
    name: 'Organic Artisanal Cauliflower Velouté Base',
    sku: 'VEL-CAU-LT',
    category: 'Starters & Pantry',
    unit: 'litre',
    defaultPurchasePrice: 450.00,
    preferredSupplierId: 'SUP-006',
    minOrderQty: 5
  },
  {
    id: 'PROD-010',
    name: 'Organic Purple Shiso Leaves & Microgreens Tray',
    sku: 'MIC-SHI-TR',
    category: 'Garnish & Produce',
    unit: 'tray',
    defaultPurchasePrice: 350.00,
    preferredSupplierId: 'SUP-006',
    minOrderQty: 4
  }
];

/**
 * Generate a unique, stable ID for line items.
 * Uses a timestamp + random alphanumeric string so items never rely on array index as key.
 */
export const createStableLineItemId = () => {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Create a fresh, empty line item with a stable ID.
 */
export const createEmptyLineItem = () => ({
  id: createStableLineItemId(),
  productId: '',
  productName: '',
  sku: '',
  unit: '',
  quantity: 1,
  purchasePrice: '',
  subtotal: 0
});

/**
 * Generate a unique purchase reference code.
 * E.g., PO-2026-8492
 */
export const generatePurchaseReference = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `PO-${year}-${randomNum}`;
};

/**
 * Initial historical purchases for demonstration & audit
 */
export const INITIAL_MOCK_PURCHASES = [
  {
    id: 'PUR-001',
    referenceNumber: 'PO-2026-1024',
    purchaseDate: '2026-10-18',
    supplierId: 'SUP-001',
    supplierName: 'Miyazaki Wagyu Guild',
    supplierOpeningBalance: 45000.00,
    paymentMethod: 'Bank Transfer',
    status: 'Received',
    items: [
      {
        id: 'item-init-1',
        productId: 'PROD-001',
        productName: 'A5 Miyazaki Wagyu Tenderloin',
        sku: 'WAG-A5-KG',
        unit: 'kg',
        quantity: 10,
        purchasePrice: 8500.00,
        subtotal: 85000.00
      },
      {
        id: 'item-init-2',
        productId: 'PROD-006',
        productName: 'A5 Wagyu Bone Marrow Bones',
        sku: 'BMR-WAG-KG',
        unit: 'kg',
        quantity: 5,
        purchasePrice: 1200.00,
        subtotal: 6000.00
      }
    ],
    totalCost: 91000.00,
    amountPaid: 50000.00,
    remainingBalance: 41000.00,
    notes: 'Premium autumn banquet prime cuts delivery. Temperature logged at -18C upon arrival.'
  },
  {
    id: 'PUR-002',
    referenceNumber: 'PO-2026-1031',
    purchaseDate: '2026-10-20',
    supplierId: 'SUP-003',
    supplierName: 'Périgord Truffle & Fungi Co.',
    supplierOpeningBalance: 62000.00,
    paymentMethod: 'Credit Card',
    status: 'Received',
    items: [
      {
        id: 'item-init-3',
        productId: 'PROD-003',
        productName: 'Fresh Black Winter Périgord Truffles',
        sku: 'TRF-WIN-G',
        unit: 'g',
        quantity: 200,
        purchasePrice: 180.00,
        subtotal: 36000.00
      }
    ],
    totalCost: 36000.00,
    amountPaid: 36000.00,
    remainingBalance: 0.00,
    notes: 'Direct courier delivery from Périgord. Exceptional moisture and fragrance.'
  }
];
