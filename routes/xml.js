const express = require('express');
const router = express.Router();
const {
  generateAlertXML, generateUsersXML, generateLogsXML,
  generateReportXML, parseXML, saxParseXML,
  transformXML, getXMLFiles, getXMLFile,
} = require('../controllers/xmlController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/alerts', generateAlertXML);
router.get('/users', authorize('superadmin', 'admin'), generateUsersXML);
router.get('/logs', authorize('superadmin', 'admin'), generateLogsXML);
router.get('/report', generateReportXML);
router.post('/parse', parseXML);
router.post('/parse/sax', saxParseXML);
router.post('/transform', transformXML);
router.get('/files', getXMLFiles);
router.get('/files/:filename', getXMLFile);

module.exports = router;
