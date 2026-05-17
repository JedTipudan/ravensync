const logger = require('../config/logger');

const TOPICS = {
  EMERGENCY: 'emergency.alerts',
  NOTIFICATIONS: 'notifications',
  BROADCASTS: 'broadcasts',
  DEAD_LETTER: 'dead.letter',
};

const offlineQueue = [];
let producer = null;
let consumer = null;
let kafka = null;
let reconnectTimer = null;

// Suppress KafkaJS partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const _getKafka = () => {
  const { Kafka, logLevel } = require('kafkajs');
  const config = {
    clientId: 'ravensync',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: { retries: 5, initialRetryTime: 500, factor: 1.5 },
    logLevel: logLevel.ERROR,
  };
  // RedPanda Cloud (or any SASL broker) — only enabled when credentials are set
  if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
    config.ssl = true;
    config.sasl = {
      mechanism: 'scram-sha-256',
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD,
    };
  }
  return new Kafka(config);
};

const _createTopics = async (admin) => {
  await admin.connect();
  const existing = await admin.listTopics();
  const toCreate = Object.values(TOPICS)
    .filter((t) => !existing.includes(t))
    .map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 }));
  if (toCreate.length) await admin.createTopics({ topics: toCreate });
  await admin.disconnect();
};

const _flushOfflineQueue = async () => {
  if (!offlineQueue.length) return;
  logger.info(`📤 Flushing ${offlineQueue.length} offline-queued messages...`);
  for (const { topic, message } of offlineQueue.splice(0)) {
    await producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
  }
};

const _scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    logger.info('🔄 Retrying Kafka connection...');
    await connectKafka();
  }, 10000);
};

const connectKafka = async () => {
  try {
    kafka = _getKafka();

    // Ensure topics exist
    const admin = kafka.admin();
    await _createTopics(admin);

    // Producer
    producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();
    producer.on('producer.disconnect', () => {
      logger.warn('⚠️ Kafka producer disconnected — scheduling reconnect');
      producer = null;
      _scheduleReconnect();
    });

    // Consumer
    consumer = kafka.consumer({ groupId: 'ravensync-group' });
    await consumer.connect();
    await consumer.subscribe({ topics: Object.values(TOPICS), fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          logger.info(`[KAFKA] Received on ${topic}: ${JSON.stringify(payload)}`);
        } catch (e) {
          logger.error(`[KAFKA] Failed to parse message: ${e.message}`);
        }
      },
    });

    await _flushOfflineQueue();
    logger.info('✅ Kafka connected — producer & consumer running');
    return true;
  } catch (error) {
    producer = null;
    consumer = null;
    logger.warn(`⚠️ Kafka not available: ${error.message} — offline queue active`);
    _scheduleReconnect();
    return false;
  }
};

const _publish = async (topic, message) => {
  if (producer) {
    try {
      await producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
      return;
    } catch (error) {
      logger.error(`Kafka publish failed, queuing offline: ${error.message}`);
      producer = null;
      _scheduleReconnect();
    }
  }
  offlineQueue.push({ topic, message });
  logger.info(`[OFFLINE] Queued locally (${offlineQueue.length} pending) → ${topic}`);
};

const publishAlert = async (alert) => {
  await _publish(TOPICS.EMERGENCY, {
    id: alert._id.toString(),
    title: alert.title,
    severity: alert.severity,
    type: alert.type,
    timestamp: new Date().toISOString(),
  });
  logger.info(`Alert published: ${alert.title}`);
};

const publishNotification = async (notification) => {
  await _publish(TOPICS.NOTIFICATIONS, notification);
};

const getQueueStats = async () => {
  if (!producer) {
    return {
      connected: false,
      simulated: true,
      offlinePending: offlineQueue.length,
      queues: [
        { name: TOPICS.EMERGENCY, messages: Math.floor(Math.random() * 10), consumers: 2, ready: Math.floor(Math.random() * 5) },
        { name: TOPICS.NOTIFICATIONS, messages: Math.floor(Math.random() * 25), consumers: 3, ready: Math.floor(Math.random() * 15) },
        { name: TOPICS.BROADCASTS, messages: Math.floor(Math.random() * 8), consumers: 1, ready: Math.floor(Math.random() * 4) },
        { name: TOPICS.DEAD_LETTER, messages: Math.floor(Math.random() * 3), consumers: 0, ready: 0 },
      ],
      throughput: { published: Math.floor(Math.random() * 500 + 100), consumed: Math.floor(Math.random() * 480 + 90), failed: Math.floor(Math.random() * 5) },
    };
  }
  return {
    connected: true,
    offlinePending: 0,
    queues: Object.values(TOPICS).map((t) => ({ name: t, messages: 0, consumers: 1, ready: 0 })),
    throughput: { published: 0, consumed: 0, failed: 0 },
  };
};

module.exports = { connectKafka, publishAlert, publishNotification, getQueueStats, TOPICS };
