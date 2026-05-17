const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, markRead, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/', getAnnouncements);
router.post('/', authorize('superadmin', 'admin'), createAnnouncement);
router.patch('/:id/read', markRead);
router.delete('/:id', authorize('superadmin', 'admin'), deleteAnnouncement);

module.exports = router;
