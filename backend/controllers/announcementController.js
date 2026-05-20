const Announcement = require('../models/Announcement');
const { broadcastToAll } = require('../services/websocketService');
const { publish, isConnected, QUEUES } = require('../services/rabbitMQService');

exports.getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const query = category ? { category } : {};
    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('author', 'name role')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: announcements, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, category, targetDepartment, isPinned } = req.body;
    const announcement = await Announcement.create({
      title, content, category, targetDepartment, isPinned,
      author: req.user._id,
    });
    await announcement.populate('author', 'name role');
    broadcastToAll({ type: 'NEW_ANNOUNCEMENT', data: announcement });
    // Queue notification task — ensures offline users get notified on reconnect
    if (isConnected()) publish(QUEUES.ANNOUNCEMENTS, { announcementId: announcement._id.toString(), title: announcement.title, category: announcement.category });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });
    res.json({ success: true });
  } catch (error) { next(error); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
};
