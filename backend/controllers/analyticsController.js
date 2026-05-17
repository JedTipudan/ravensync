const Alert = require('../models/Alert');
const Report = require('../models/Report');
const User = require('../models/User');
const Message = require('../models/Message');
const Channel = require('../models/Channel');

exports.getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      // Alert counts
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalAlerts,

      // Alerts by type (real)
      alertsByType,

      // Alerts by severity (real)
      alertsBySeverity,

      // Alert volume last 7 days (real)
      alertVolume7d,

      // Alert volume last 30 days (real)
      alertVolume30d,

      // Avg resolution time (alerts that have resolvedAt)
      resolutionTimes,

      // Student response stats (all reports)
      totalReports,
      safeReports,
      helpReports,
      damageReports,

      // Response rate per alert (how many students responded vs total students)
      totalStudents,

      // Messages sent in last 7 days
      messagesLast7d,

      // Channel stats
      totalChannels,
      activeChannels,

      // User stats
      totalUsers,
      activeUsers,

      // Most active alert (most reports)
      topAlerts,

    ] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ status: 'resolved' }),
      Alert.countDocuments({ severity: 'critical', status: 'active' }),

      Alert.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),

      Alert.aggregate([
        { $match: { createdAt: { $gte: day7 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      Alert.aggregate([
        { $match: { createdAt: { $gte: day30 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Resolution time in minutes for resolved alerts
      Alert.aggregate([
        { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
        { $project: { mins: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 60000] } } },
        { $group: { _id: null, avg: { $avg: '$mins' }, min: { $min: '$mins' }, max: { $max: '$mins' } } },
      ]),

      Report.countDocuments(),
      Report.countDocuments({ status: 'safe' }),
      Report.countDocuments({ status: 'need_help' }),
      Report.countDocuments({ status: 'damage_report' }),

      User.countDocuments({ role: 'user', isActive: true }),

      Message.countDocuments({ createdAt: { $gte: day7 }, type: { $ne: 'alert' } }),

      Channel.countDocuments(),
      Channel.countDocuments({ isActive: true }),

      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, lastLogin: { $gte: day7 } }),

      // Top 5 alerts by response count
      Report.aggregate([
        { $group: { _id: '$alert', responseCount: { $sum: 1 }, helpCount: { $sum: { $cond: [{ $eq: ['$status', 'need_help'] }, 1, 0] } } } },
        { $sort: { responseCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'alerts', localField: '_id', foreignField: '_id', as: 'alert' } },
        { $unwind: '$alert' },
        { $project: { title: '$alert.title', severity: '$alert.severity', type: '$alert.type', responseCount: 1, helpCount: 1 } },
      ]),
    ]);

    // Build 7-day labels filled with 0 for missing days
    const last7Labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const volumeMap7 = Object.fromEntries(alertVolume7d.map(r => [r._id, r.count]));
    const volume7d = last7Labels.map(d => ({ date: d, count: volumeMap7[d] || 0 }));

    // Build 30-day labels
    const last30Labels = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    const volumeMap30 = Object.fromEntries(alertVolume30d.map(r => [r._id, r.count]));
    const volume30d = last30Labels.map(d => ({ date: d, count: volumeMap30[d] || 0 }));

    const rt = resolutionTimes[0] || { avg: 0, min: 0, max: 0 };
    const responseRate = totalStudents > 0 ? Math.round((totalReports / Math.max(totalStudents, 1)) * 100) : 0;

    res.json({
      success: true,
      data: {
        // KPIs
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        criticalAlerts,
        totalStudents,
        totalReports,
        responseRate: Math.min(responseRate, 100),
        activeUsers,

        // Resolution time (minutes)
        avgResolutionMins: rt.avg ? Math.round(rt.avg) : null,
        minResolutionMins: rt.min ? Math.round(rt.min) : null,
        maxResolutionMins: rt.max ? Math.round(rt.max) : null,

        // Student responses
        safeReports,
        helpReports,
        damageReports,

        // Charts
        alertsByType,
        alertsBySeverity,
        volume7d,
        volume30d,

        // Channels & messages
        totalChannels,
        activeChannels,
        messagesLast7d,

        // Users
        totalUsers,

        // Top alerts
        topAlerts,
      },
    });
  } catch (error) { next(error); }
};
