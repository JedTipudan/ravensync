const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: false, sparse: true, lowercase: true, trim: true, set: v => (v === '' || v == null) ? undefined : v },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  organization: { type: String, trim: true },
  department: { type: String, trim: true },
  phone: { type: String, trim: true },
  studentId: { type: String, trim: true },
  course: { type: String, trim: true },
  yearLevel: { type: String, trim: true },
  section: { type: String, trim: true },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
  chatWarnings: { type: Number, default: 0 },
  mutedUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
