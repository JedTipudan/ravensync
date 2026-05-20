const { create } = require('xmlbuilder2');
const xml2js = require('xml2js');
const sax = require('sax');
const logger = require('../config/logger');

exports.generateAlertXML = (alert) => {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('RavenSyncAlert', { xmlns: 'http://ravensync.io/alert', version: '1.0' })
      .ele('AlertMetadata')
        .ele('AlertID').txt(alert._id.toString()).up()
        .ele('CreatedAt').txt(alert.createdAt.toISOString()).up()
        .ele('Status').txt(alert.status).up()
        .ele('Priority').txt(alert.priority.toString()).up()
      .up()
      .ele('AlertContent')
        .ele('Title').txt(alert.title).up()
        .ele('Message').txt(alert.message).up()
        .ele('Type').txt(alert.type).up()
        .ele('Severity').txt(alert.severity).up()
        .ele('AffectedArea').txt(alert.affectedArea || 'N/A').up()
        .ele('Instructions').txt(alert.instructions || 'Follow standard protocols').up()
      .up()
      .ele('AuthorInfo')
        .ele('AuthorID').txt(alert.author?._id?.toString() || 'system').up()
        .ele('AuthorName').txt(alert.author?.name || 'System').up()
        .ele('AuthorEmail').txt(alert.author?.email || 'system@ravensync.io').up()
      .up()
    .up();
  return doc.end({ prettyPrint: true });
};

exports.generateAlertsXML = (alerts) => {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('RavenSyncAlerts', { xmlns: 'http://ravensync.io/alerts', version: '1.0', generatedAt: new Date().toISOString() })
      .ele('Summary')
        .ele('TotalAlerts').txt(alerts.length.toString()).up()
        .ele('GeneratedAt').txt(new Date().toISOString()).up()
        .ele('Platform').txt('RavenSync Emergency Communication Platform').up()
      .up();

  const alertsEle = doc.root().ele('Alerts');
  alerts.forEach(alert => {
    alertsEle.ele('Alert', { id: alert._id.toString(), severity: alert.severity })
      .ele('Title').txt(alert.title).up()
      .ele('Type').txt(alert.type).up()
      .ele('Status').txt(alert.status).up()
      .ele('Message').txt(alert.message).up()
      .ele('AffectedArea').txt(alert.affectedArea || 'N/A').up()
      .ele('CreatedAt').txt(alert.createdAt.toISOString()).up()
      .ele('Author').txt(alert.author?.name || 'System').up()
    .up();
  });

  return doc.end({ prettyPrint: true });
};

exports.generateUsersXML = (users) => {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('RavenSyncUsers', { xmlns: 'http://ravensync.io/users', version: '1.0', generatedAt: new Date().toISOString() })
      .ele('Summary')
        .ele('TotalUsers').txt(users.length.toString()).up()
        .ele('GeneratedAt').txt(new Date().toISOString()).up()
        .ele('Platform').txt('RavenSync Emergency Communication Platform').up()
      .up();

  const usersEle = doc.root().ele('Users');
  users.forEach(u => {
    usersEle.ele('User', { id: u._id.toString(), role: u.role })
      .ele('Name').txt(u.name).up()
      .ele('Username').txt(u.username).up()
      .ele('Organization').txt(u.organization || 'N/A').up()
      .ele('Department').txt(u.department || 'N/A').up()
      .ele('Course').txt(u.course || 'N/A').up()
      .ele('YearLevel').txt(u.yearLevel || 'N/A').up()
      .ele('IsActive').txt(u.isActive.toString()).up()
      .ele('CreatedAt').txt(u.createdAt.toISOString()).up()
    .up();
  });

  return doc.end({ prettyPrint: true });
};

exports.generateLogsXML = (logs) => {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('RavenSyncAuditLogs', { xmlns: 'http://ravensync.io/logs', version: '1.0', generatedAt: new Date().toISOString() })
      .ele('Summary')
        .ele('TotalEntries').txt(logs.length.toString()).up()
        .ele('GeneratedAt').txt(new Date().toISOString()).up()
      .up();

  const logsEle = doc.root().ele('LogEntries');
  logs.forEach(log => {
    logsEle.ele('LogEntry', { id: log._id.toString() })
      .ele('Action').txt(log.action || 'N/A').up()
      .ele('User').txt(log.user?.name || 'System').up()
      .ele('Resource').txt(log.resource || 'N/A').up()
      .ele('IPAddress').txt(log.ipAddress || 'N/A').up()
      .ele('Timestamp').txt(log.createdAt.toISOString()).up()
    .up();
  });

  return doc.end({ prettyPrint: true });
};

exports.generateReportXML = (alerts, filters) => {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('RavenSyncReport', { xmlns: 'http://ravensync.io/report', version: '1.0' })
      .ele('ReportMetadata')
        .ele('ReportID').txt(`RPT-${Date.now()}`).up()
        .ele('GeneratedAt').txt(new Date().toISOString()).up()
        .ele('GeneratedBy').txt('RavenSync Analytics Engine').up()
        .ele('Filters')
          .ele('StartDate').txt(filters.startDate || 'N/A').up()
          .ele('EndDate').txt(filters.endDate || 'N/A').up()
          .ele('Type').txt(filters.type || 'all').up()
        .up()
      .up()
      .ele('Statistics')
        .ele('TotalAlerts').txt(alerts.length.toString()).up()
        .ele('CriticalAlerts').txt(alerts.filter(a => a.severity === 'critical').length.toString()).up()
        .ele('ResolvedAlerts').txt(alerts.filter(a => a.status === 'resolved').length.toString()).up()
        .ele('ActiveAlerts').txt(alerts.filter(a => a.status === 'active').length.toString()).up()
      .up();

  const recordsEle = doc.root().ele('AlertRecords');
  alerts.forEach(alert => {
    recordsEle.ele('Record')
      .ele('ID').txt(alert._id.toString()).up()
      .ele('Title').txt(alert.title).up()
      .ele('Type').txt(alert.type).up()
      .ele('Severity').txt(alert.severity).up()
      .ele('Status').txt(alert.status).up()
      .ele('CreatedAt').txt(alert.createdAt.toISOString()).up()
    .up();
  });

  return doc.end({ prettyPrint: true });
};

// DOM Parsing — tree-based, returns full object
exports.parseXML = async (xmlContent) => {
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  return new Promise((resolve, reject) => {
    parser.parseString(xmlContent, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// SAX Parsing — event-driven, returns element/attribute/text event log
exports.saxParseXML = (xmlContent) => {
  return new Promise((resolve, reject) => {
    const parser = sax.parser(true, { trim: true, normalize: true });
    const events = [];
    let elementCount = 0;
    let attributeCount = 0;
    let textCount = 0;
    let depth = 0;

    parser.onopentag = (node) => {
      elementCount++;
      depth++;
      const attrs = Object.keys(node.attributes);
      attributeCount += attrs.length;
      events.push({
        event: 'openTag',
        element: node.name,
        attributes: node.attributes,
        depth,
      });
    };
    parser.onclosetag = (name) => {
      depth--;
      events.push({ event: 'closeTag', element: name });
    };
    parser.ontext = (text) => {
      if (text.trim()) {
        textCount++;
        events.push({ event: 'text', value: text.trim() });
      }
    };
    parser.onerror = (err) => reject(err);
    parser.onend = () => resolve({ events, stats: { elementCount, attributeCount, textCount, totalEvents: events.length } });
    parser.write(xmlContent).close();
  });
};

exports.transformXML = async (xmlContent, format) => {
  if (format === 'json') {
    const parsed = await exports.parseXML(xmlContent);
    return JSON.stringify(parsed, null, 2);
  }
  if (format === 'html') {
    const parsed = await exports.parseXML(xmlContent);
    return generateHTMLReport(parsed);
  }
  return xmlContent;
};

function generateHTMLReport(obj) {
  // Check if it looks like a RavenSync alerts document
  const root = obj.RavenSyncAlerts || obj.RavenSyncReport || obj.RavenSyncUsers || obj.RavenSyncAuditLogs;
  if (!root) return generateHTMLFromParsed(obj);

  const alerts = root.Alerts?.Alert || root.AlertRecords?.Record || [];
  const users = root.Users?.User || [];
  const logs = root.LogEntries?.LogEntry || [];
  const summary = root.Summary || {};
  const items = [].concat(alerts, users, logs);

  if (!items.length) return generateHTMLFromParsed(obj);

  const rows = items.map(item => {
    const cells = Object.entries(item)
      .filter(([k]) => !k.startsWith('$'))
      .map(([k, v]) => `<td>${typeof v === 'object' ? JSON.stringify(v) : v}</td>`)
      .join('');
    return `<tr>${cells}</tr>`;
  });

  const headers = Object.keys(items[0])
    .filter(k => !k.startsWith('$'))
    .map(k => `<th>${k}</th>`).join('');

  const summaryCards = Object.entries(summary)
    .map(([k, v]) => {
      const display = (k.toLowerCase().includes('at') || k.toLowerCase().includes('date')) && typeof v === 'string' && v.includes('T')
        ? new Date(v).toLocaleString()
        : v;
      return `<div class="stat-card"><div class="stat-value">${display}</div><div class="stat-label">${k}</div></div>`;
    })
    .join('');

  return `
    <style>
      .rs-report * { box-sizing: border-box; margin: 0; padding: 0; }
      .rs-report { font-family: 'Segoe UI', sans-serif; background: #ffffff; color: #1e293b; padding: 1.5rem; }
      .rs-report .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; color: white; }
      .rs-report .header .logo { font-size: 1.3rem; margin-bottom: 0.25rem; }
      .rs-report .header h1 { font-size: 1.5rem; font-weight: 700; }
      .rs-report .header p { font-size: 0.8rem; opacity: 0.85; margin-top: 0.25rem; }
      .rs-report .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
      .rs-report .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; text-align: center; }
      .rs-report .stat-value { font-size: 1.6rem; font-weight: 700; color: #6366f1; word-break: break-all; overflow-wrap: anywhere; line-height: 1.3; }
      .rs-report .stat-label { font-size: 0.75rem; color: #64748b; margin-top: 0.2rem; }
      .rs-report .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem; }
      .rs-report .section h2 { font-size: 1rem; font-weight: 600; color: #4f46e5; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; }
      .rs-report table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      .rs-report th { background: #ede9fe; color: #4f46e5; padding: 0.6rem 0.75rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
      .rs-report td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
      .rs-report tr:hover td { background: #f8fafc; }
      .rs-report .footer { text-align: center; color: #94a3b8; font-size: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    </style>
    <div class="rs-report">
      <div class="header">
        <div class="logo">🦅 RavenSync</div>
        <h1>Data Report</h1>
        <p>Generated: ${new Date().toLocaleString()} | Records: ${items.length}</p>
      </div>
      <div class="stats-grid">${summaryCards}</div>
      <div class="section">
        <h2>📋 Records</h2>
        <table><thead><tr>${headers}</tr></thead><tbody>${rows.join('')}</tbody></table>
      </div>
      <div class="footer"><p>RavenSync Emergency Communication Platform | XSLT-Transformed Report</p></div>
    </div>
  `;
}

function generateHTMLFromParsed(obj, depth = 0) {
  if (typeof obj === 'string') return `<span class="xml-value">${obj}</span>`;
  if (typeof obj !== 'object') return `<span class="xml-value">${obj}</span>`;
  let html = '<ul class="xml-tree">';
  for (const [key, value] of Object.entries(obj)) {
    html += `<li><span class="xml-key">${key}</span>: ${generateHTMLFromParsed(value, depth + 1)}</li>`;
  }
  html += '</ul>';
  return html;
}


