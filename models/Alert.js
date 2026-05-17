const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['emergency', 'warning', 'info', 'drill', 'announcement', 'weather', 'security'],
    default: 'info',
  },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['active', 'resolved', 'scheduled', 'draft'], default: 'active' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
  targetOrganizations: [{ type: String }],
  affectedArea: { type: String },
  instructions: { type: String },
  expiresAt: { type: Date },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qrCode: { type: String },
  xmlData: { type: String },
  readBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: Date }],
  broadcastCount: { type: Number, default: 0 },
  priority: { type: Number, default: 5, min: 1, max: 10 },
  tags: [{ type: String }],
  attachments: [{ name: String, url: String, type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

alertSchema.index({ status: 1, severity: 1, createdAt: -1 });
alertSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
