const AuditLog = require('../models/AuditLog');

const auditLogger = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    try {
      await AuditLog.create({
        user: req.user?._id,
        action,
        resource,
        resourceId: req.params?.id,
        details: { method: req.method, path: req.path, body: req.body },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: res.statusCode < 400 ? 'success' : 'failure',
      });
    } catch (e) { /* silent */ }
    return originalJson(data);
  };
  next();
};

module.exports = auditLogger;
