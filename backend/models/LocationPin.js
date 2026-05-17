const mongoose = require('mongoose');

const locationPinSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, required: true },
  x:         { type: Number, required: true },
  y:         { type: Number, required: true },
  time:      { type: String },
}, { timestamps: true });

// One pin per user — upsert on save
locationPinSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('LocationPin', locationPinSchema);
