// Load environment variables from backend/.env (e.g. MONGODB_URI)
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Channel = require('../models/Channel');
const logger = require('../config/logger');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    // Wipe everything EXCEPT channels
    await Promise.all([
      User.deleteMany(),
      Alert.deleteMany(),
      mongoose.connection.collection('auditlogs').deleteMany({}),
      mongoose.connection.collection('announcements').deleteMany({}),
      mongoose.connection.collection('messages').deleteMany({}),
      mongoose.connection.collection('locationpins').deleteMany({}),
      mongoose.connection.collection('adminpins').deleteMany({}),
      mongoose.connection.collection('reports').deleteMany({}),
      mongoose.connection.collection('channelrequests').deleteMany({}),
    ]);
    logger.info('✅ All data cleared (channels preserved)');

    // Reset channel stats so they look fresh
    await Channel.updateMany({}, { messageCount: 0, lastActivity: new Date() });
    logger.info('✅ Channel stats reset');

    // Recreate default superadmin
    const admin = await User.create({
      name: 'Administrator',
      username: 'admin',
      password: 'admin123',
      role: 'superadmin',
      organization: 'RavenSync School',
      department: 'Administration',
      isActive: true,
      isVerified: true,
    });
    logger.info('✅ Admin account recreated');

    // Re-assign channels to new admin _id
    await Channel.updateMany({}, { createdBy: admin._id, $set: { members: [admin._id] } });
    logger.info('✅ Channels reassigned to new admin');

    logger.info('\n🎉 Fresh start complete! Channels preserved.');
    logger.info('👤 admin / admin123');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
