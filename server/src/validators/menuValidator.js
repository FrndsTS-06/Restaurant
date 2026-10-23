const ALLOWED_DIETARY = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Nut-Free', 'Halal'];

const validateMenuItemPayload = (req, res, next) => {
  const {
    name,
    description,
    category,
    price,
    costPrice,
    prepTimeMinutes,
    calories,
    dietary
  } = req.body;
  const errors = [];

  // If this is a create request (POST) or fields are present in PUT
  const isCreate = req.method === 'POST';

  if (isCreate || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Dish name must be at least 2 characters.');
    } else if (name.trim().length > 120) {
      errors.push('Dish name cannot exceed 120 characters.');
    }
  }

  if (isCreate || description !== undefined) {
    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      errors.push('Dish description must be at least 5 characters.');
    } else if (description.trim().length > 600) {
      errors.push('Dish description cannot exceed 600 characters.');
    }
  }

  if (isCreate || category !== undefined) {
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push('Dish category is required.');
    }
  }

  if (isCreate || price !== undefined) {
    const numPrice = Number(price);
    if (price === undefined || isNaN(numPrice) || numPrice <= 0) {
      errors.push('Price must be a positive number greater than 0.');
    } else if (numPrice > 10000) {
      errors.push('Price cannot exceed ₹10,000.00.');
    }
  }

  if (costPrice !== undefined) {
    const numCost = Number(costPrice);
    if (isNaN(numCost) || numCost < 0) {
      errors.push('Cost price must be non-negative.');
    }
  }

  if (prepTimeMinutes !== undefined) {
    const numPrep = parseInt(prepTimeMinutes, 10);
    if (isNaN(numPrep) || numPrep < 1 || numPrep > 300) {
      errors.push('Preparation time must be between 1 and 300 minutes.');
    }
  }

  if (calories !== undefined) {
    const numCal = parseInt(calories, 10);
    if (isNaN(numCal) || numCal < 0 || numCal > 10000) {
      errors.push('Calories must be between 0 and 10,000.');
    }
  }

  if (dietary !== undefined && Array.isArray(dietary)) {
    for (const d of dietary) {
      if (!ALLOWED_DIETARY.includes(d)) {
        errors.push(`Invalid dietary tag "${d}". Allowed values: ${ALLOWED_DIETARY.join(', ')}.`);
        break;
      }
    }
  }

  const ALLOWED_MODEL_STATUS = ['available', 'pending_approval', 'missing_asset', 'in_development'];
  if (req.body.modelStatus !== undefined && !ALLOWED_MODEL_STATUS.includes(req.body.modelStatus)) {
    errors.push(`Invalid modelStatus "${req.body.modelStatus}". Allowed values: ${ALLOWED_MODEL_STATUS.join(', ')}.`);
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

module.exports = { validateMenuItemPayload, ALLOWED_DIETARY };
