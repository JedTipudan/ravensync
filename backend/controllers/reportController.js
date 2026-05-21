const Report = require('../models/Report');
const LocationPin = require('../models/LocationPin');
const { broadcastToAll } = require('../services/websocketService');

exports.submitReport = async (req, res, next) => {
  try {
    const { status, message, location } = req.body;
    const alertId = req.params.alertId;

    const report = await Report.findOneAndUpdate(
      { alert: alertId, user: req.user._id },
      { status, message, location, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'name role organization department');

    broadcastToAll({ type: 'STUDENT_REPORT', data: report });

    // If user marked safe — remove their location pin so admin list cleans up
    if (status === 'safe') {
      await LocationPin.findOneAndDelete({ userId: req.user._id });
      broadcastToAll({ type: 'LOCATION_PIN_REMOVED', data: { userId: req.user._id.toString() } });
    }

    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ alert: req.params.alertId })
      .populate('user', 'name role organization department')
      .sort({ updatedAt: -1 });

    const summary = {
      safe: reports.filter(r => r.status === 'safe').length,
      need_help: reports.filter(r => r.status === 'need_help').length,
      damage_report: reports.filter(r => r.status === 'damage_report').length,
      total: reports.length,
    };

    res.json({ success: true, data: reports, summary });
  } catch (error) { next(error); }
};

exports.getMyReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ alert: req.params.alertId, user: req.user._id });
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};
