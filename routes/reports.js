const express = require('express');
const router = express.Router();
const { submitReport, getReports, getMyReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.post('/:alertId', submitReport);
router.get('/:alertId/me', getMyReport);
router.get('/:alertId', authorize('superadmin', 'admin'), getReports);

module.exports = router;
