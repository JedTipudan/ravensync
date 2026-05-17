const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { body } = require('express-validator');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
], register);

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/avatar', protect, uploadAvatar);

module.exports = router;
