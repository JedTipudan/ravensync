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

    await Promise.all([User.deleteMany(), Alert.deleteMany(), Channel.deleteMany()]);

    const superadmin = await User.create({
      name: 'Super Administrator',
      username: 'superadmin',
      password: 'super123',
      role: 'superadmin',
      organization: 'RavenSync School',
      department: 'Administration',
      isActive: true,
      isVerified: true,
    });

    const admin = await User.create({
      name: 'Prof. Juan dela Cruz',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      organization: 'RavenSync School',
      department: 'DRRM Office',
      isActive: true,
      isVerified: true,
    });

    const student = await User.create({
      name: 'Maria Santos',
      username: 'student',
      password: 'student123',
      role: 'user',
      organization: 'RavenSync School',
      department: 'Grade 10 - Section A',
      isActive: true,
      isVerified: true,
    });

    logger.info('✅ Users created');

    await Channel.create([
      {
        name: 'Emergency Response Network',
        description: 'Primary emergency communication channel',
        type: 'emergency',
        lockedDuringEmergency: true,
        createdBy: superadmin._id,
        members: [superadmin._id, admin._id, student._id],
        icon: '🚨',
        color: '#ef4444',
      },
      {
        name: 'General Announcements',
        description: 'School-wide announcements and official notices',
        type: 'broadcast',
        lockedDuringEmergency: true,
        createdBy: superadmin._id,
        members: [superadmin._id, admin._id, student._id],
        icon: '📢',
        color: '#6366f1',
      },
      {
        name: 'Community Safety Hub',
        description: 'Open space for safety tips, weather updates, preparedness discussions, and community support.',
        type: 'public',
        lockedDuringEmergency: false,
        createdBy: superadmin._id,
        members: [superadmin._id, admin._id, student._id],
        icon: '🛡️',
        color: '#10b981',
      },
    ]);

    logger.info('✅ Channels created');

    await Alert.insertMany([
      {
        title: 'Typhoon Signal No. 3 — Immediate Evacuation Required',
        message: 'Typhoon Carina is approaching. All students must evacuate to designated evacuation centers immediately.',
        type: 'emergency', severity: 'critical', status: 'active', author: admin._id,
        affectedArea: 'Entire School Campus',
        instructions: 'Proceed to the gymnasium. Bring your ID and emergency kit.',
        priority: 10, broadcastCount: 0, tags: ['typhoon', 'evacuation'],
      },
      {
        title: 'Flash Flood Warning',
        message: 'Heavy rainfall has caused flash flooding near the school grounds.',
        type: 'weather', severity: 'high', status: 'active', author: admin._id,
        affectedArea: 'Ground Floor Buildings',
        instructions: 'Move to upper floors immediately. Do not use elevators.',
        priority: 8, broadcastCount: 0, tags: ['flood', 'weather'],
      },
    ]);

    logger.info('✅ Alerts created');
    logger.info('\n🎉 Database seeded successfully!');
    logger.info('👤 superadmin / super123');
    logger.info('👤 admin / admin123');
    logger.info('👤 student / student123');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
