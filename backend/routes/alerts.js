const express = require('express');
const router = express.Router();
const { getAlerts, createAlert, getAlert, updateAlert, resolveAlert, deleteAlert, getStats } = require('../controllers/alertController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/stats', getStats);
router.get('/', getAlerts);
router.post('/', authorize('superadmin', 'admin'), createAlert);
router.get('/:id', getAlert);
router.put('/:id', authorize('superadmin', 'admin'), updateAlert);
router.patch('/:id/resolve', authorize('superadmin', 'admin'), resolveAlert);
router.delete('/:id', authorize('superadmin', 'admin'), deleteAlert);

module.exports = router;
