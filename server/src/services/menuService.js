const MenuItem = require('../models/MenuItem');
const { memoryStore } = require('../utils/seedData');
const mongoose = require('mongoose');

class MenuService {
  async getCategories() {
    return ['All', 'Starters', 'Mains', 'Desserts', 'Beverages', 'Chef Specials'];
  }

  async getFeaturedDishes(limit = 4) {
    if (mongoose.connection.readyState === 1) {
      return await MenuItem.find({ isAvailable: true }).limit(limit);
    }
    return memoryStore.menuItems.slice(0, limit);
  }
}

module.exports = new MenuService();
