const xmlService = require('../services/xmlService');
const Alert = require('../models/Alert');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs');

const XML_DIR = path.join(__dirname, '../xml');

// Ensure xml dir exists
if (!fs.existsSync(XML_DIR)) fs.mkdirSync(XML_DIR, { recursive: true });

exports.generateAlertXML = async (req, res, next) => {
  try {
    const alerts = await Alert.find().populate('author', 'name email').sort({ createdAt: -1 }).limit(100);
    const xml = xmlService.generateAlertsXML(alerts);
    // Save to file
    fs.writeFileSync(path.join(XML_DIR, 'emergency_alerts.xml'), xml);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) { next(error); }
};

exports.generateUsersXML = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).sort({ createdAt: -1 });
    const xml = xmlService.generateUsersXML(users);
    fs.writeFileSync(path.join(XML_DIR, 'user_profiles.xml'), xml);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) { next(error); }
};

exports.generateLogsXML = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('user', 'name').sort({ createdAt: -1 }).limit(200);
    const xml = xmlService.generateLogsXML(logs);
    fs.writeFileSync(path.join(XML_DIR, 'audit_logs.xml'), xml);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) { next(error); }
};

exports.generateReportXML = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    const query = {};
    if (startDate && endDate) query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (type) query.type = type;
    const alerts = await Alert.find(query).populate('author', 'name email');
    const xml = xmlService.generateReportXML(alerts, { startDate, endDate, type });
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) { next(error); }
};

// DOM Parsing
exports.parseXML = async (req, res, next) => {
  try {
    const { xmlContent } = req.body;
    if (!xmlContent) return res.status(400).json({ success: false, message: 'XML content required' });
    const result = await xmlService.parseXML(xmlContent);
    // Count nodes
    const nodeCount = (JSON.stringify(result).match(/\{/g) || []).length;
    res.json({ success: true, data: result, stats: { nodeCount, method: 'DOM', valid: true } });
  } catch (error) {
    res.status(400).json({ success: false, message: 'XML parse error: ' + error.message });
  }
};

// SAX Parsing
exports.saxParseXML = async (req, res, next) => {
  try {
    const { xmlContent } = req.body;
    if (!xmlContent) return res.status(400).json({ success: false, message: 'XML content required' });
    const result = await xmlService.saxParseXML(xmlContent);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: 'SAX parse error: ' + error.message });
  }
};

exports.transformXML = async (req, res, next) => {
  try {
    const { xmlContent, format } = req.body;
    const result = await xmlService.transformXML(xmlContent, format || 'html');
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getXMLFiles = async (req, res, next) => {
  try {
    if (!fs.existsSync(XML_DIR)) return res.json({ success: true, data: [] });
    const files = fs.readdirSync(XML_DIR).filter(f => f.endsWith('.xml')).map(f => {
      const stat = fs.statSync(path.join(XML_DIR, f));
      return { name: f, size: stat.size, modified: stat.mtime };
    });
    res.json({ success: true, data: files });
  } catch (error) { next(error); }
};

exports.getXMLFile = async (req, res, next) => {
  try {
    // Sanitize filename to prevent path traversal
    const filename = path.basename(req.params.filename);
    const filePath = path.join(XML_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, data: content });
  } catch (error) { next(error); }
};
