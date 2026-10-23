const Order = require('../models/Order');
const { memoryStore } = require('../utils/seedData');
const mongoose = require('mongoose');

class OrderService {
  async calculateSalesSummary() {
    let ordersList = [];
    if (mongoose.connection.readyState === 1) {
      ordersList = await Order.find();
    } else {
      ordersList = memoryStore.orders;
    }

    const totalRevenue = ordersList.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0);
    const activeOrders = ordersList.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
    const completedOrders = ordersList.filter(o => o.status === 'delivered').length;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: ordersList.length,
      activeOrders,
      completedOrders
    };
  }
}

module.exports = new OrderService();
