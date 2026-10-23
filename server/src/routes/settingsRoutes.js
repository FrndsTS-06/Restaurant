const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const { validateSettingsPayload } = require('../validators/settingsValidator');

router.get('/', getSettings);
router.put('/', protect, authorize('admin'), validateSettingsPayload, updateSettings);

module.exports = router;
