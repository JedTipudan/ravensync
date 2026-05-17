const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

const SCRIPTS_DIR = path.join(__dirname, '../scripts');
const BACKEND_DIR = path.join(__dirname, '..');

const availableScripts = [
  { id: 'xml-backup',     name: 'XML Backup',             file: 'xml-backup.ps1',     description: 'Backup all XML data files to timestamped archive', category: 'backup' },
  { id: 'xml-transform',  name: 'XML Transform',          file: 'xml-transform.ps1',  description: 'Transform XML files to HTML reports via XSLT',     category: 'xml' },
  { id: 'log-cleanup',    name: 'Log Cleanup',            file: 'log-cleanup.ps1',    description: 'Remove log files older than 30 days',              category: 'maintenance' },
  { id: 'health-check',   name: 'Health Check',           file: 'health-check.ps1',   description: 'Full system health diagnostics',                   category: 'monitoring' },
  { id: 'queue-consumer', name: 'Queue Consumer',         file: 'queue-consumer.ps1', description: 'Start Kafka/RabbitMQ message consumer',            category: 'messaging' },
  { id: 'report-gen',     name: 'Report Generator',       file: 'report-gen.ps1',     description: 'Generate XML analytics reports',                   category: 'reports' },
  { id: 'db-backup',      name: 'Database Backup',        file: 'db-backup.ps1',      description: 'Export MongoDB collections to JSON backup',        category: 'backup' },
  { id: 'db-restore',     name: 'Database Restore',       file: 'db-restore.ps1',     description: 'Restore MongoDB from latest backup (non-interactive)', category: 'backup', args: '-Latest -Force' },
  { id: 'notify-process', name: 'Notification Processor', file: 'notify-process.ps1', description: 'Process and dispatch pending notifications',       category: 'notifications' },
];

exports.getScripts = async (req, res) => {
  // Annotate each script with whether the file actually exists on disk
  const data = availableScripts.map(s => ({
    ...s,
    exists: fs.existsSync(path.join(SCRIPTS_DIR, s.file)),
  }));
  res.json({ success: true, data });
};

exports.runScript = (req, res, next) => {
  try {
    const { scriptId } = req.params;
    const script = availableScripts.find(s => s.id === scriptId);
    if (!script) return res.status(404).json({ success: false, message: 'Script not found' });

    const scriptPath = path.join(SCRIPTS_DIR, script.file);
    const startTime = Date.now();

    if (!fs.existsSync(scriptPath)) {
      // Script file missing — return clear message
      return res.json({
        success: true,
        data: {
          scriptId, scriptName: script.name,
          output: `[${new Date().toISOString()}] [WARNING] Script file not found: ${script.file}\n[INFO] ${script.description}\n[INFO] Place the .ps1 file in backend/scripts/ to enable real execution.`,
          duration: Date.now() - startTime,
          exitCode: 0, executedAt: new Date(), executedBy: req.user.name, real: false,
        },
      });
    }

    const command = process.platform === 'win32'
      ? `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" ${script.args || ''}`
      : `pwsh -File "${scriptPath}" ${script.args || ''}`;

    // queue-consumer is long-running — cap at 5s and return what we get
    const timeout = script.id === 'queue-consumer' ? 5000 : 30000;

    exec(command, { cwd: BACKEND_DIR, timeout }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      const rawOut = (stdout || '').trim();
      const rawErr = (stderr || '').trim();
      const timedOut = error?.killed || error?.signal === 'SIGTERM';
      const output = [rawOut, rawErr].filter(Boolean).join('\n')
        || (timedOut ? `[INFO] ${script.name} started (long-running process)` : error?.message || 'No output');
      logger.info(`Script executed: ${script.name} by ${req.user.name} (${duration}ms, exit:${error && !timedOut ? 1 : 0})`);
      res.json({
        success: true,
        data: {
          scriptId, scriptName: script.name, output, duration,
          exitCode: error && !timedOut ? 1 : 0,
          executedAt: new Date(), executedBy: req.user.name, real: true,
        },
      });
    });
  } catch (error) { next(error); }
};

exports.getScriptLogs = async (req, res, next) => {
  try {
    const logFile = path.join(__dirname, '../logs/combined.log');
    if (!fs.existsSync(logFile)) return res.json({ success: true, data: [] });
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(Boolean).slice(-100).reverse();
    res.json({ success: true, data: lines });
  } catch (error) { next(error); }
};
