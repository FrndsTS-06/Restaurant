import { request } from './api';

export const fallbackMenuDishes = [
  {
    _id: 'dish_01',
    name: 'Pan-Seared Hokkaido Scallops',
    description: 'Caramelized cauliflower velouté, black winter truffle pearls, and crisped pancetta crumb.',
    category: 'Starters',
    price: 24.50,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    tags: ['Signature', 'Gluten-Free'],
    dietary: ['Gluten-Free'],
    isAvailable: true,
    rating: 4.9,
    prepTimeMinutes: 15,
    calories: 340
  },
  {
    _id: 'dish_02',
    name: 'Heirloom Burrata & Roasted Fig',
    description: 'Aged Modena balsamic glaze, pistachios, micro arugula, and grilled country levain.',
    category: 'Starters',
    price: 19.00,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?auto=format&fit=crop&w=800&q=80',
    tags: ['Vegetarian', 'Popular'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    rating: 4.8,
    prepTimeMinutes: 12,
    calories: 420
  },
  {
    _id: 'dish_03',
    name: 'A5 Miyazaki Wagyu Ribeye',
    description: 'Charred broccolini, bone marrow jus, smoked salt flakes, and potato mousseline.',
    category: 'Mains',
    price: 68.00,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    tags: ['Chef Special', 'Gluten-Free'],
    dietary: ['Gluten-Free'],
    isAvailable: true,
    rating: 5.0,
    prepTimeMinutes: 25,
    calories: 780
  },
  {
    _id: 'dish_04',
    name: 'Wild Chilean Sea Bass',
    description: 'Miso-mirin glaze, baby bok choy, lemongrass dashi emulsion, and lotus crisp.',
    category: 'Mains',
    price: 44.00,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    tags: ['Chef Special', 'Seafood'],
    dietary: ['Dairy-Free', 'Gluten-Free'],
    isAvailable: true,
    rating: 4.9,
    prepTimeMinutes: 20,
    calories: 520
  },
  {
    _id: 'dish_05',
    name: 'Wild Forest Truffle Tagliolini',
    description: 'Handcrafted bronze-die pasta, 36-month Parmigiano-Reggiano cream, shaved Norcia black truffle.',
    category: 'Mains',
    price: 36.00,
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80',
    tags: ['Handmade', 'Vegetarian'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    rating: 4.9,
    prepTimeMinutes: 18,
    calories: 610
  },
  {
    _id: 'dish_06',
    name: 'Grand Cru Dark Chocolate Sphere',
    description: 'Warm salted caramel ganache poured tableside, Madagascar vanilla bean gelato, and hazelnut praline.',
    category: 'Desserts',
    price: 16.50,
    image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80',
    tags: ['Decadent', 'Vegetarian'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    rating: 4.9,
    prepTimeMinutes: 10,
    calories: 550
  },
  {
    _id: 'dish_07',
    name: 'Meyer Lemon & Yuzu Tart',
    description: 'Torched French meringue, Sicilian pistachio crumb, and crystallised mint leaves.',
    category: 'Desserts',
    price: 14.00,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    tags: ['Citrus', 'Vegetarian'],
    dietary: ['Vegetarian'],
    isAvailable: true,
    rating: 4.7,
    prepTimeMinutes: 8,
    calories: 380
  },
  {
    _id: 'dish_08',
    name: 'Smoked Rosemary Old Fashioned',
    description: 'Small-batch bourbon, demerara sugar syrup, aromatic bitters, smoked with white oak tableside.',
    category: 'Beverages',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    tags: ['Artisanal Cocktail'],
    dietary: ['Vegan', 'Gluten-Free'],
    isAvailable: true,
    rating: 4.9,
    prepTimeMinutes: 5,
    calories: 190
  },
  {
    _id: 'dish_09',
    name: 'Sparkling Hibiscus & Berry Mocktail',
    description: 'Cold-pressed wild hibiscus elixir, crushed blackberries, Sicilian lime, topped with elderflower soda.',
    category: 'Beverages',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    tags: ['Zero-Proof', 'Refreshing'],
    dietary: ['Vegan', 'Gluten-Free'],
    isAvailable: true,
    rating: 4.8,
    prepTimeMinutes: 5,
    calories: 110
  }
];

export const getMenuItems = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters.dietary && filters.dietary !== 'All') params.append('dietary', filters.dietary);
  if (filters.search) params.append('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const res = await request(`/menu${query}`);
    return res.data;
  } catch {
    // Return gracefully filtered fallback
    let list = [...fallbackMenuDishes];
    if (filters.category && filters.category !== 'All') {
      list = list.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.dietary && filters.dietary !== 'All') {
      list = list.filter(i => i.dietary?.includes(filters.dietary));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  }
};

export const createMenuItem = async (itemData) => {
  return await request('/menu', {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
};

export const updateMenuItem = async (id, itemData) => {
  return await request(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData)
  });
};

export const deleteMenuItem = async (id) => {
  return await request(`/menu/${id}`, {
    method: 'DELETE'
  });
};
