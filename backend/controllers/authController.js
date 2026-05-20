const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const logger = require('../config/logger');

const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/avatars'),
  filename: (req, file, cb) => cb(null, `avatar_${req.user._id}${path.extname(file.originalname)}`),
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  },
}).single('avatar');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password, organization, department, phone, studentId, course, yearLevel, section } = req.body;
    if (!studentId || !/^\d{4}-\d{5}$/.test(studentId))
      return res.status(400).json({ success: false, message: 'Student ID must be in YYYY-NNNNN format (e.g. 2021-00123)' });
    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone))
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    if (await User.findOne({ username })) return res.status(400).json({ success: false, message: 'Username already taken' });
    if (await User.findOne({ studentId })) return res.status(400).json({ success: false, message: 'Student ID already registered' });

    const user = await User.create({
      name, username, email: email || undefined, password,
      role: 'user', organization, department, phone,
      studentId, course, yearLevel, section,
    });
    const token = generateToken(user._id);
    logger.info(`New user registered: ${username}`);
    res.status(201).json({ success: true, token, user });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    logger.info(`User logged in: ${username}`);
    res.json({ success: true, token, user: user.toJSON() });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res) => {
  // Re-fetch to include mutedUntil and chatWarnings (not always in req.user)
  const user = await require('../models/User').findById(req.user._id).select('name username role organization department phone avatar mutedUntil chatWarnings isActive createdAt');
  res.json({ success: true, user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, organization, department, phone, notificationPreferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, organization, department, phone, notificationPreferences, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.uploadAvatar = (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    try {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
      res.json({ success: true, avatar: avatarUrl, user });
    } catch (error) { next(error); }
  });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) { next(error); }
};
