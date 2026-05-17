const mongoose = require('mongoose');

const adminPinSchema = new mongoose.Schema({
  type:  { type: String, required: true },
  x:     { type: Number, required: true },
  y:     { type: Number, required: true },
  label: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AdminPin', adminPinSchema);
