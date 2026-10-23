const RestaurantSettings = require('../models/RestaurantSettings');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    Get restaurant settings
// @route   GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({});
    }
    return sendSuccess(res, settings, 'Settings retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant settings (Admin)
// @route   PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create(req.body);
    } else {
      settings = await RestaurantSettings.findByIdAndUpdate(settings._id, req.body, { new: true, runValidators: true });
    }
    return sendSuccess(res, settings, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
