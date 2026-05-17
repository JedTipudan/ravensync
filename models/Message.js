const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'alert', 'system', 'file', 'xml'], default: 'text' },
  priority: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{ name: String, url: String, type: String }],
  metadata: { type: mongoose.Schema.Types.Mixed },
  isDeleted: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  hasProfanity: { type: Boolean, default: false },
  replyTo: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    senderName: { type: String },
    content: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
