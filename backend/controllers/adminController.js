const User = require('../models/User');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const Channel = require('../models/Channel');
const Report = require('../models/Report');
const FilteredWord = require('../models/FilteredWord');
const { loadCustomWords, getCustomWords, getBaseWords } = require('../utils/profanityFilter');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, activeAlerts, totalChannels, recentLogs, alertTrend, userGrowth, needHelp] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Alert.countDocuments({ status: 'active' }),
      Channel.countDocuments({ isActive: true }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name username'),
      Alert.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Report.countDocuments({ status: 'need_help' }),
    ]);

    res.json({ success: true, data: { totalUsers, activeAlerts, totalChannels, recentLogs, alertTrend, userGrowth, needHelp } });
  } catch (error) { next(error); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }];
    if (role) query.role = role;
    // admins can only see users, superadmin sees all
    if (req.user.role === 'admin') query.role = 'user';

    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, username, password, role, organization, department } = req.body;
    if (await User.findOne({ username })) return res.status(400).json({ success: false, message: 'Username already taken' });
    const user = await User.create({ name, username, password, role: role || 'user', organization, department });
    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getFilteredWords = async (req, res, next) => {
  try {
    const custom = await FilteredWord.find().populate('addedBy', 'name username').sort({ createdAt: -1 });
    res.json({ success: true, data: { custom, base: getBaseWords() } });
  } catch (error) { next(error); }
};

exports.addFilteredWord = async (req, res, next) => {
  try {
    const word = (req.body.word || '').trim().toLowerCase();
    if (!word) return res.status(400).json({ success: false, message: 'Word is required' });
    if (word.length > 100) return res.status(400).json({ success: false, message: 'Word too long' });
    const existing = await FilteredWord.findOne({ word });
    if (existing) return res.status(400).json({ success: false, message: `"${word}" is already in the filter list` });
    await FilteredWord.create({ word, addedBy: req.user._id });
    await loadCustomWords(); // refresh in-memory patterns
    res.status(201).json({ success: true, message: `"${word}" added to filter` });
  } catch (error) { next(error); }
};

exports.deleteFilteredWord = async (req, res, next) => {
  try {
    const deleted = await FilteredWord.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Word not found' });
    await loadCustomWords(); // refresh in-memory patterns
    res.json({ success: true, message: `"${deleted.word}" removed from filter` });
  } catch (error) { next(error); }
};
