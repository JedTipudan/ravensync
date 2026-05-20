const logger = require('../config/logger');

const QUEUES = {
  AUDIT_LOGS: 'audit.logs',
  ANNOUNCEMENTS: 'announcements',
  GUIDE_USER: 'guide.user',
};

let channel = null;
let connection = null;
let reconnectTimer = null;

const connectRabbitMQ = async () => {
  try {
    const amqplib = require('amqplib');
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqplib.connect(url);
    channel = await connection.createChannel();

    // Declare all queues as durable — survive broker restarts
    for (const q of Object.values(QUEUES)) {
      await channel.assertQueue(q, { durable: true });
    }

    connection.on('close', () => {
      logger.warn('⚠️ RabbitMQ connection closed — scheduling reconnect');
      channel = null;
      connection = null;
      _scheduleReconnect();
    });

    connection.on('error', (err) => {
      logger.error(`RabbitMQ error: ${err.message}`);
    });

    logger.info('✅ RabbitMQ connected — queues ready');
    return true;
  } catch (error) {
    channel = null;
    connection = null;
    logger.warn(`⚠️ RabbitMQ not available: ${error.message} — tasks will run synchronously`);
    _scheduleReconnect();
    return false;
  }
};

const _scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    logger.info('🔄 Retrying RabbitMQ connection...');
    await connectRabbitMQ();
  }, 10000);
};

// Publish a message to a queue — persistent so it survives broker restart
const publish = (queue, payload) => {
  if (!channel) return false;
  try {
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
    return true;
  } catch (err) {
    logger.error(`RabbitMQ publish failed: ${err.message}`);
    return false;
  }
};

// Start consuming a queue — handler receives the parsed payload
const consume = async (queue, handler) => {
  if (!channel) return;
  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      channel.ack(msg); // acknowledge only after successful processing
    } catch (err) {
      logger.error(`[RABBITMQ] Handler error on ${queue}: ${err.message}`);
      channel.nack(msg, false, false); // discard — don't requeue infinite loop
    }
  });
  logger.info(`[RABBITMQ] Consumer started on queue: ${queue}`);
};

const isConnected = () => !!channel;

module.exports = { connectRabbitMQ, publish, consume, isConnected, QUEUES };
