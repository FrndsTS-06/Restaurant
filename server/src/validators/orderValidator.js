const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

const validateOrderPayload = (req, res, next) => {
  const { customer, items, orderType = 'delivery', deliveryAddress, tableNumber, paymentMethod } = req.body;
  const errors = [];

  // 1. Customer validation
  if (!customer || typeof customer !== 'object') {
    errors.push('Customer details object is required.');
  } else {
    if (!customer.name || typeof customer.name !== 'string' || customer.name.trim().length < 2) {
      errors.push('Customer name must be at least 2 characters.');
    } else if (customer.name.trim().length > 100) {
      errors.push('Customer name cannot exceed 100 characters.');
    }

    if (!customer.email || typeof customer.email !== 'string' || !EMAIL_REGEX.test(customer.email.trim())) {
      errors.push('Please provide a valid customer email address.');
    }

    if (!customer.phone || typeof customer.phone !== 'string' || !PHONE_REGEX.test(customer.phone.trim())) {
      errors.push('Please provide a valid customer phone number.');
    } else if (customer.phone.trim().length > 30) {
      errors.push('Customer phone number cannot exceed 30 characters.');
    }
  }

  // 2. Order Modality validation
  const validOrderTypes = ['delivery', 'dine-in', 'curbside', 'takeaway', 'pickup'];
  if (orderType && !validOrderTypes.includes(orderType)) {
    errors.push(`Invalid order type "${orderType}". Must be one of: ${validOrderTypes.join(', ')}.`);
  }

  // 3. Delivery address validation if delivery
  if (orderType === 'delivery') {
    if (!deliveryAddress || typeof deliveryAddress !== 'object') {
      errors.push('Delivery address details are required for delivery orders.');
    } else {
      const street = deliveryAddress.street;
      if (!street || typeof street !== 'string' || street.trim().length < 3) {
        errors.push('Delivery address street must be at least 3 characters.');
      } else if (street.trim().length > 150) {
        errors.push('Delivery street address cannot exceed 150 characters.');
      }

      if (deliveryAddress.city && (typeof deliveryAddress.city !== 'string' || deliveryAddress.city.trim().length > 60)) {
        errors.push('City cannot exceed 60 characters.');
      }

      if (deliveryAddress.zipCode && (typeof deliveryAddress.zipCode !== 'string' || deliveryAddress.zipCode.trim().length > 15)) {
        errors.push('Zip code cannot exceed 15 characters.');
      }
    }
  }

  // 4. Table number validation if dine-in
  if (orderType === 'dine-in') {
    if (!tableNumber || typeof tableNumber !== 'string' || tableNumber.trim().length === 0) {
      errors.push('Table assignment (number or salon area) is required for dine-in orders.');
    }
  }

  // 5. Items validation
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Order must contain at least 1 item.');
  } else {
    items.forEach((item, index) => {
      const qty = Number(item.quantity);
      const hasMenuItem = item.menuItem || item.menuItemId || item._id;
      if (!hasMenuItem && (!item.name || typeof item.name !== 'string')) {
        errors.push(`Item #${index + 1} is missing a valid item name.`);
      }
      if (isNaN(qty) || qty < 1 || qty > 100) {
        errors.push(`Item #${index + 1} quantity must be an integer between 1 and 100.`);
      }
      if (!hasMenuItem && (item.price === undefined || isNaN(Number(item.price)) || Number(item.price) <= 0)) {
        errors.push(`Item #${index + 1} has an invalid price.`);
      }
    });
  }

  // 6. Payment method validation
  const validPaymentMethods = ['razorpay', 'cash', 'card', 'stripe'];
  if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
    errors.push(`Invalid payment method "${paymentMethod}".`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

module.exports = { validateOrderPayload };
