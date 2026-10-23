const validateCategoryPayload = (req, res, next) => {
  const { name, description, displayOrder } = req.body;
  const errors = [];
  const isCreate = req.method === 'POST';

  if (isCreate || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Category name must be at least 2 characters.');
    } else if (name.trim().length > 60) {
      errors.push('Category name cannot exceed 60 characters.');
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.trim().length > 300) {
      errors.push('Description cannot exceed 300 characters.');
    }
  }

  if (displayOrder !== undefined) {
    const numOrder = Number(displayOrder);
    if (isNaN(numOrder) || numOrder < 0) {
      errors.push('Display sort order must be a non-negative number.');
    }
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

module.exports = { validateCategoryPayload };
