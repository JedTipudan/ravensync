const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, enum: ['public', 'private', 'emergency', 'broadcast'], default: 'public' },
  organization: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  lockedDuringEmergency: { type: Boolean, default: false }, // if true, only admins can post when an alert is active
  icon: { type: String, default: '📡' },
  color: { type: String, default: '#6366f1' },
  messageCount: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Channel', channelSchema);
