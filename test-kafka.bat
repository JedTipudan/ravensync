@echo off
echo ========================================
echo Testing Kafka Connection
echo ========================================
echo.

cd backend

echo Installing dependencies if needed...
call npm install >nul 2>&1

echo.
echo Testing Kafka connection...
echo.

node -e "const { connectKafka } = require('./services/messagingService'); connectKafka().then(success => { console.log(success ? '\n✅ SUCCESS: Kafka is connected and working!' : '\n⚠️ Kafka connection failed - check if Docker services are running'); process.exit(success ? 0 : 1); }).catch(err => { console.error('\n❌ ERROR:', err.message); process.exit(1); });"

echo.
echo ========================================
pause
