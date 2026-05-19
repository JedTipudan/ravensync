// Load environment variables from backend/.env (e.g. MONGODB_URI)
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Channel = require('../models/Channel');
const logger = require('../config/logger');

const seed = async () => {
  try {
    // Connect to MongoDB using the URI from .env
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    // Wipe existing data so we start fresh every time seed runs
    // WARNING: This deletes ALL users, alerts, and channels
    await Promise.all([User.deleteMany(), Alert.deleteMany(), Channel.deleteMany()]);

    // Create the default superadmin account
    // To change the username or password, edit the values below
    // Password must be at least 6 characters
    const admin = await User.create({
      name: 'Administrator',
      username: 'admin',       // login username
      password: 'admin123',    // login password
      role: 'superadmin',      // full access to everything
      organization: 'RavenSync School',
      department: 'Administration',
      isActive: true,
      isVerified: true,
    });

    logger.info('✅ Users created');

    // Create the default channels
    // type options: 'emergency' | 'broadcast' | 'public' | 'private'
    // lockedDuringEmergency: true = only admins can post when an alert is active
    await Channel.create([
      {
        name: 'Emergency Response Network',
        description: 'Primary emergency communication channel',
        type: 'emergency',
        lockedDuringEmergency: true, // locked for regular users during active alerts
        createdBy: admin._id,
        members: [admin._id],
        icon: '🚨',
        color: '#ef4444',
      },
      {
        name: '🚨 Emergency Broadcasts',
        description: 'Official emergency broadcast channel',
        type: 'emergency',
        lockedDuringEmergency: true,
        createdBy: admin._id,
        members: [admin._id],
        icon: '🚨',
        color: '#dc2626',
      },
      {
        name: 'General Announcements',
        description: 'School-wide announcements and official notices',
        type: 'broadcast',        // read-only for regular users, admin posts only
        lockedDuringEmergency: true,
        createdBy: admin._id,
        members: [admin._id],
        icon: '📢',
        color: '#6366f1',
      },
      {
        name: 'Community Safety Hub',
        description: 'Open space for safety tips, weather updates, preparedness discussions, and community support.',
        type: 'public',           // everyone can post here
        lockedDuringEmergency: false,
        createdBy: admin._id,
        members: [admin._id],
        icon: '🛡️',
        color: '#10b981',
      },
    ]);

    logger.info('✅ Channels created');

    // Create sample/demo alerts so the dashboard isn't empty on first run
    // These are just for demo purposes — delete them in production if needed
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
    logger.info('👤 admin / admin123'); // default login credentials
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
