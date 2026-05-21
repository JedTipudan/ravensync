const mongoose = require('mongoose');

const channelRequestSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  icon:        { type: String, default: '📡' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote:  { type: String },
  createdAt:   { type: Date, default: Date.now },
  reviewedAt:  { type: Date },
});

module.exports = mongoose.model('ChannelRequest', channelRequestSchema);
