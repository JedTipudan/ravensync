require('dotenv').config();
const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'ravensync-consumer-cli',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
});

const consumer = kafka.consumer({ groupId: 'ravensync-cli-group' });

const TOPICS = ['emergency.alerts', 'notifications', 'broadcasts', 'dead.letter'];

(async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: TOPICS, fromBeginning: true });
  console.log('[LISTENING] Kafka consumer running. Press Ctrl+C to stop.');
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const ts = new Date().toISOString();
      const value = message.value ? message.value.toString() : '(empty)';
      console.log('[' + ts + '] [' + topic + '] ' + value);
    },
  });
})().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
