const AuditLog = require('../models/AuditLog');
const { publish, isConnected, QUEUES } = require('../services/rabbitMQService');

const auditLogger = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    const entry = {
      user: req.user?._id,
      action,
      resource,
      resourceId: req.params?.id,
      details: { method: req.method, path: req.path, body: req.body },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: res.statusCode < 400 ? 'success' : 'failure',
    };
    try {
      // Prefer async queue — fall back to direct DB write if RabbitMQ is down
      if (!isConnected() || !publish(QUEUES.AUDIT_LOGS, entry)) {
        await AuditLog.create(entry);
      }
    } catch (e) { /* silent */ }
    return originalJson(data);
  };
  next();
};

module.exports = auditLogger;
