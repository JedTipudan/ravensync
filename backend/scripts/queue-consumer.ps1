# RavenSync — Kafka Consumer Script
# Runs a real KafkaJS consumer for all RavenSync topics

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Write-Host "[$timestamp] Starting Kafka consumer service..." -ForegroundColor Cyan
Write-Host "[INFO] Broker: localhost:9092" -ForegroundColor White
Write-Host "[INFO] Group ID: ravensync-group" -ForegroundColor White
Write-Host "[INFO] Topics: emergency.alerts, notifications, broadcasts, dead.letter" -ForegroundColor White

$backendPath = Join-Path $PSScriptRoot ".."

$consumerScript = @"
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
"@

$tmpFile = Join-Path $backendPath "_rs_consumer_tmp.js"
$consumerScript | Out-File -FilePath $tmpFile -Encoding UTF8

Write-Host "[SUCCESS] Consumer starting..." -ForegroundColor Green
Push-Location $backendPath
try {
  node $tmpFile
} finally {
  Pop-Location
  Remove-Item $tmpFile -ErrorAction SilentlyContinue
}
