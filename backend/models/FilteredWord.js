const mongoose = require('mongoose');

const filteredWordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true, lowercase: true, trim: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FilteredWord', filteredWordSchema);
