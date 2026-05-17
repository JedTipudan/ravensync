const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, authorize('superadmin', 'admin'), getAnalytics);

module.exports = router;
