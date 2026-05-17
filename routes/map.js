const express = require('express');
const router = express.Router();
const LocationPin = require('../models/LocationPin');
const AdminPin = require('../models/AdminPin');
const { protect, authorize } = require('../middlewares/auth');
const { broadcastToAll } = require('../services/websocketService');

router.use(protect);

// GET all user location pins (admin only)
router.get('/pins', authorize('superadmin', 'admin'), async (req, res) => {
  const pins = await LocationPin.find().lean();
  res.json({ success: true, data: pins });
});

// POST save/update current user's location pin
router.post('/pins', async (req, res) => {
  const { x, y, time } = req.body;
  const pin = await LocationPin.findOneAndUpdate(
    { userId: req.user._id },
    { userId: req.user._id, name: req.user.name, x, y, time },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: pin });
});

// DELETE a user's pin (admin or the user themselves)
router.delete('/pins/:userId', async (req, res) => {
  const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
  const isSelf = req.user._id.toString() === req.params.userId;
  if (!isAdmin && !isSelf) return res.status(403).json({ success: false, message: 'Forbidden' });
  await LocationPin.findOneAndDelete({ userId: req.params.userId });
  res.json({ success: true });
});

// ── Admin Pins (visible to all users) ────────────────────────────────────

// GET all admin pins (any authenticated user)
router.get('/admin-pins', async (req, res) => {
  const pins = await AdminPin.find().lean();
  res.json({ success: true, data: pins });
});

// POST create admin pin
router.post('/admin-pins', authorize('superadmin', 'admin'), async (req, res) => {
  const { type, x, y, label } = req.body;
  const pin = await AdminPin.create({ type, x, y, label, createdBy: req.user._id });
  const all = await AdminPin.find().lean();
  broadcastToAll({ type: 'ADMIN_PINS_UPDATE', data: all });
  res.json({ success: true, data: pin });
});

// DELETE admin pin
router.delete('/admin-pins/:id', authorize('superadmin', 'admin'), async (req, res) => {
  await AdminPin.findByIdAndDelete(req.params.id);
  const all = await AdminPin.find().lean();
  broadcastToAll({ type: 'ADMIN_PINS_UPDATE', data: all });
  res.json({ success: true });
});

// DELETE all admin pins
router.delete('/admin-pins', authorize('superadmin', 'admin'), async (req, res) => {
  await AdminPin.deleteMany({});
  broadcastToAll({ type: 'ADMIN_PINS_UPDATE', data: [] });
  res.json({ success: true });
});

module.exports = router;
