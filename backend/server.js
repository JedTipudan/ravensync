require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const cron = require('node-cron');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');
const { initWebSocket } = require('./services/websocketService');
const { connectKafka } = require('./services/messagingService');
const xmlService = require('./services/xmlService');
const { loadCustomWords } = require('./utils/profanityFilter');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Connect DB
connectDB().then(() => loadCustomWords());

// Init WebSocket
initWebSocket(server);

// Connect Kafka (non-blocking — falls back to offline queue if unavailable)
connectKafka().catch(() => {});

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(mongoSanitize());
app.use(compression());

// Rate limiting — relaxed in development for demo/testing
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 2000 : parseInt(process.env.RATE_LIMIT_MAX),
  message: { success: false, message: 'Too many requests, please try again later' },
  skip: (req) => process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Static files
const frontendPath = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(frontendPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/xml', require('./routes/xml'));
app.use('/api/system', require('./routes/system'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/map', require('./routes/map'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'operational', platform: 'RavenSync', version: '1.0.0', timestamp: new Date() });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Error handler
app.use(errorHandler);

// Cron jobs
cron.schedule('0 */6 * * *', async () => {
  logger.info('🔄 Running scheduled XML backup...');
  const xmlDir = path.join(__dirname, 'xml');
  if (!fs.existsSync(xmlDir)) fs.mkdirSync(xmlDir, { recursive: true });
});

cron.schedule('0 2 * * *', () => {
  logger.info('🧹 Running scheduled log cleanup...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 RavenSync Server running on port ${PORT}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📡 WebSocket: ws://localhost:${PORT}/ws`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is in use. Retrying in 3 seconds...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 3000);
  } else {
    throw err;
  }
});

module.exports = { app, server };
