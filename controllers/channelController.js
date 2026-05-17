const Channel = require('../models/Channel');
const Message = require('../models/Message');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { broadcastToChannel, sendToUser } = require('../services/websocketService');
const { containsProfanity, censorText } = require('../utils/profanityFilter');

const _rateLimitMap = new Map();
const RATE_LIMIT_MS = 5000;

// Mute durations in minutes per warning count (index = warningCount after increment)
// warnings 1,2 = no mute | 3 = 5min | 4 = 10min | 5+ = 15min each
function _getMuteDuration(warningCount) {
  if (warningCount <= 2) return 0;
  if (warningCount === 3) return 5;
  if (warningCount === 4) return 10;
  return 15; // 5th warning and every one after
}

function _fmtTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

async function _handleProfanity(userId, channelId) {
  const user = await User.findById(userId);
  if (!user) return { warned: true, muted: false, warningCount: 1, muteEndsAt: null };

  user.chatWarnings = (user.chatWarnings || 0) + 1;
  const muteMins = _getMuteDuration(user.chatWarnings);

  let muteEndsAt = null;
  if (muteMins > 0) {
    muteEndsAt = new Date(Date.now() + muteMins * 60 * 1000);
    user.mutedUntil = muteEndsAt;
  }
  await user.save();

  // Notify the user via WebSocket with their warning status
  sendToUser(userId.toString(), {
    type: 'CHAT_WARNING',
    warningCount: user.chatWarnings,
    muted: muteMins > 0,
    muteMins,
    muteEndsAt,
  });

  return { warned: true, muted: muteMins > 0, warningCount: user.chatWarnings, muteEndsAt, muteMins };
}

async function _checkMuted(userId) {
  const user = await User.findById(userId).select('mutedUntil chatWarnings');
  if (!user || !user.mutedUntil) return null;
  if (new Date() < user.mutedUntil) return user.mutedUntil;
  // Mute expired — clear it
  await User.findByIdAndUpdate(userId, { mutedUntil: null });
  return null;
}

exports.getChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ lastActivity: -1 });
    res.json({ success: true, data: channels });
  } catch (error) { next(error); }
};

exports.createChannel = async (req, res, next) => {
  try {
    const { type } = req.body;
    if ((type === 'emergency' || type === 'broadcast') && req.user.role === 'user')
      return res.status(403).json({ success: false, message: 'Only admins can create emergency or broadcast channels' });
    const locked = type === 'emergency' || type === 'broadcast';
    const channel = await Channel.create({
      ...req.body,
      lockedDuringEmergency: locked,
      createdBy: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json({ success: true, data: channel });
  } catch (error) { next(error); }
};

exports.joinChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.user._id } },
      { new: true }
    );
    res.json({ success: true, data: channel });
  } catch (error) { next(error); }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ channel: req.params.id, isDeleted: false })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: messages.reverse() });
  } catch (error) { next(error); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });

    if ((channel.type === 'emergency' || channel.type === 'broadcast') && !isAdmin)
      return res.status(403).json({ success: false, message: 'This channel is read-only. Only instructors can post here.' });

    if (channel.lockedDuringEmergency && !isAdmin) {
      const activeAlert = await Alert.findOne({ status: 'active' }).lean();
      if (activeAlert)
        return res.status(403).json({ success: false, message: 'Channel is locked during active emergency. Use the response panel to report your status.' });
    }

    if (!isAdmin) {
      // Check mute
      const mutedUntil = await _checkMuted(req.user._id);
      if (mutedUntil) {
        const remaining = mutedUntil - Date.now();
        return res.status(403).json({
          success: false,
          muted: true,
          muteEndsAt: mutedUntil,
          message: `You are muted for ${_fmtTime(remaining)} due to repeated use of prohibited language.`,
        });
      }

      // Rate limit
      const userId = req.user._id.toString();
      const lastSent = _rateLimitMap.get(userId) || 0;
      const now = Date.now();
      if (now - lastSent < RATE_LIMIT_MS) {
        const wait = Math.ceil((RATE_LIMIT_MS - (now - lastSent)) / 1000);
        return res.status(429).json({ success: false, message: `Please wait ${wait}s before sending another message.` });
      }
      _rateLimitMap.set(userId, now);
    }

    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    if (content.length > 500) return res.status(400).json({ success: false, message: 'Message too long (max 500 characters)' });

    const hasProfanity = containsProfanity(content);
    const finalContent = hasProfanity ? censorText(content) : content;

    const message = await Message.create({
      channel: req.params.id,
      sender: req.user._id,
      content: finalContent,
      type: req.body.type || 'text',
      priority: req.body.priority || 'normal',
      hasProfanity,
      ...(req.body.replyTo ? { replyTo: req.body.replyTo } : {}),
    });
    await message.populate('sender', 'name email role avatar');

    await Channel.findByIdAndUpdate(req.params.id, {
      lastActivity: new Date(),
      $inc: { messageCount: 1 },
    });

    broadcastToChannel(req.params.id, { type: 'NEW_MESSAGE', data: message });

    let warningInfo = null;
    if (hasProfanity && !isAdmin) {
      warningInfo = await _handleProfanity(req.user._id, req.params.id);
    }

    res.status(201).json({
      success: true,
      warned: hasProfanity,
      warningInfo,
      data: message,
    });
  } catch (error) { next(error); }
};

exports.editMessage = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const message = await Message.findById(req.params.msgId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    if (message.type === 'alert')
      return res.status(403).json({ success: false, message: 'System messages cannot be edited' });

    if (!isAdmin) {
      const mutedUntil = await _checkMuted(req.user._id);
      if (mutedUntil) {
        const remaining = mutedUntil - Date.now();
        return res.status(403).json({
          success: false,
          muted: true,
          muteEndsAt: mutedUntil,
          message: `You are muted for ${_fmtTime(remaining)} due to repeated use of prohibited language.`,
        });
      }
    }

    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    if (content.length > 500) return res.status(400).json({ success: false, message: 'Message too long (max 500 characters)' });

    const hasProfanity = containsProfanity(content);
    const finalContent = hasProfanity ? censorText(content) : content;

    message.content = finalContent;
    message.isEdited = true;
    message.editedAt = new Date();
    message.hasProfanity = hasProfanity;
    await message.save();
    await message.populate('sender', 'name email role avatar');

    broadcastToChannel(message.channel.toString(), { type: 'MESSAGE_EDITED', data: message });

    let warningInfo = null;
    if (hasProfanity && !isAdmin) {
      warningInfo = await _handleProfanity(req.user._id, message.channel.toString());
    }

    res.json({ success: true, warned: hasProfanity, warningInfo, data: message });
  } catch (error) { next(error); }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.msgId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (message.sender.toString() !== req.user._id.toString() && !isAdmin)
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });

    message.isDeleted = true;
    await message.save();

    broadcastToChannel(message.channel.toString(), { type: 'MESSAGE_DELETED', data: { _id: message._id } });
    res.json({ success: true });
  } catch (error) { next(error); }
};
