const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const LocationPin = require('../models/LocationPin');

let wss = null;
const clients = new Map();
const channelSubscriptions = new Map();

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        clients.set(userId, ws);
        logger.info(`WebSocket connected: ${userId}`);
      } catch (e) {
        logger.warn('Invalid WebSocket token');
      }
    }

    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'RavenSync WebSocket connected', timestamp: new Date() }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'SUBSCRIBE_CHANNEL') {
          if (!channelSubscriptions.has(msg.channelId)) channelSubscriptions.set(msg.channelId, new Set());
          channelSubscriptions.get(msg.channelId).add(ws);
        }
        if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date() }));
        if (msg.type === 'LOCATION_SHARE' && userId) {
          const d = msg.data;
          LocationPin.findOneAndUpdate(
            { userId },
            { userId, name: d.name, x: d.x, y: d.y, time: d.time },
            { upsert: true, new: true }
          ).catch(() => {});
          broadcastToAll({ type: 'LOCATION_SHARE', data: { ...d, userId } });
        }
      } catch (e) { /* ignore */ }
    });

    ws.on('close', () => {
      if (userId) clients.delete(userId);
      channelSubscriptions.forEach(subs => subs.delete(ws));
    });

    ws.on('error', (err) => logger.error(`WebSocket error: ${err.message}`));
  });

  // Heartbeat
  setInterval(() => {
    broadcastToAll({ type: 'HEARTBEAT', timestamp: new Date(), connections: clients.size });
  }, 30000);

  logger.info('✅ WebSocket server initialized');
  return wss;
};

const broadcastToAll = (data) => {
  if (!wss) return;
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
};

const broadcastToChannel = (channelId, data) => {
  const subs = channelSubscriptions.get(channelId);
  if (!subs) return;
  const message = JSON.stringify(data);
  subs.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
};

const sendToUser = (userId, data) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
};

const getStats = () => ({
  totalConnections: clients.size,
  channelSubscriptions: channelSubscriptions.size,
  serverStatus: wss ? 'running' : 'stopped',
});

module.exports = { initWebSocket, broadcastToAll, broadcastToChannel, sendToUser, getStats };
