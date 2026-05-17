const Alert = require('../models/Alert');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const User = require('../models/User');
const xmlService = require('../services/xmlService');
const messagingService = require('../services/messagingService');
const qrcode = require('qrcode');
const { broadcastToAll, broadcastToChannel } = require('../services/websocketService');

exports.getAlerts = async (req, res, next) => {
  try {
    const { status, type, severity, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (search) query.$or = [{ title: new RegExp(search, 'i') }, { message: new RegExp(search, 'i') }];

    const total = await Alert.countDocuments(query);
    const alerts = await Alert.find(query)
      .populate('author', 'name email role')
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: alerts, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.createAlert = async (req, res, next) => {
  try {
    const alertData = { ...req.body, author: req.user._id };
    const alert = await Alert.create(alertData);

    // Generate QR code
    const qrData = `${process.env.FRONTEND_URL}/alerts/${alert._id}`;
    alert.qrCode = await qrcode.toDataURL(qrData);

    // Generate XML
    alert.xmlData = xmlService.generateAlertXML(alert);
    await alert.save();

    // Broadcast via WebSocket to all clients
    broadcastToAll({ type: 'NEW_ALERT', data: alert });

    // Post alert as a message to the emergency broadcast channel
    await _postAlertToEmergencyChannel(alert, req.user._id);

    // Queue message
    await messagingService.publishAlert(alert);

    res.status(201).json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.getAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('author', 'name email role');
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.updateAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    broadcastToAll({ type: 'ALERT_UPDATED', data: alert });
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    broadcastToAll({ type: 'ALERT_RESOLVED', data: alert });
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.deleteAlert = async (req, res, next) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) { next(error); }
};

// Find-or-create the emergency broadcast channel and post the alert as a message
async function _postAlertToEmergencyChannel(alert, authorId) {
  try {
    // Find or create the system emergency broadcast channel
    let channel = await Channel.findOne({ type: 'emergency', name: '🚨 Emergency Broadcasts' });
    if (!channel) {
      channel = await Channel.create({
        name: '🚨 Emergency Broadcasts',
        description: 'System channel for emergency alert notifications',
        type: 'emergency',
        icon: '🚨',
        createdBy: authorId,
        members: [],
      });
    }

    // Add all users as members if not already (so everyone sees it)
    const allUserIds = await User.distinct('_id', { isActive: true });
    await Channel.findByIdAndUpdate(channel._id, { $addToSet: { members: { $each: allUserIds } } });

    const severityEmoji = { critical: '🔴', high: '🟡', medium: '🔵', low: '🟢' }[alert.severity] || '⚠️';
    const content = [
      `${severityEmoji} **${alert.title}**`,
      alert.message,
      alert.affectedArea ? `📍 Affected Area: ${alert.affectedArea}` : '',
      alert.instructions ? `📋 Instructions: ${alert.instructions}` : '',
    ].filter(Boolean).join('\n');

    const message = await Message.create({
      channel: channel._id,
      sender: authorId,
      content,
      type: 'alert',
      priority: alert.severity === 'critical' || alert.severity === 'high' ? 'critical' : 'normal',
      metadata: { alertId: alert._id, alertType: alert.type, severity: alert.severity },
    });
    await message.populate('sender', 'name email role avatar');

    await Channel.findByIdAndUpdate(channel._id, { lastActivity: new Date(), $inc: { messageCount: 1 } });

    // Broadcast the message to anyone subscribed to this channel
    broadcastToChannel(channel._id.toString(), { type: 'NEW_MESSAGE', data: message });
    // Also broadcast channel ID so clients can auto-subscribe
    broadcastToAll({ type: 'EMERGENCY_CHANNEL', channelId: channel._id.toString() });
  } catch (err) {
    // Non-fatal — alert was already created and broadcast
    const logger = require('../config/logger');
    logger.error(`Failed to post alert to emergency channel: ${err.message}`);
  }
}

exports.getStats = async (req, res, next) => {
  try {
    const [total, active, critical, resolved, byType, bySeverity] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ severity: 'critical', status: 'active' }),
      Alert.countDocuments({ status: 'resolved' }),
      Alert.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    ]);
    res.json({ success: true, data: { total, active, critical, resolved, byType, bySeverity } });
  } catch (error) { next(error); }
};
