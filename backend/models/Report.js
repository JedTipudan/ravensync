const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  alert: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['safe', 'need_help', 'damage_report'], required: true },
  message: { type: String, trim: true },
  location: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

reportSchema.index({ alert: 1, user: 1 }, { unique: true }); // one report per user per alert

module.exports = mongoose.model('Report', reportSchema);
