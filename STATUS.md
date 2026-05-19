# ✅ RavenSync - System Status

**Date:** May 18, 2026  
**Status:** All systems operational - Running offline

---

## 🟢 Services Running

| Service | Status | Port | Container |
|---------|--------|------|-----------|
| **MongoDB** | ✅ Healthy | 27017 | ravensync-mongodb |
| **Kafka** | ✅ Running | 9092 | ravensync-kafka |
| **Kafka UI** | ✅ Running | 8080 | ravensync-kafka-ui |

---

## 📊 Kafka Topics Created

✅ `emergency.alerts` - Emergency notifications  
✅ `notifications` - User notifications  
✅ `broadcasts` - System announcements  
✅ `dead.letter` - Failed messages  

---

## 🚀 How to Start RavenSync

### 1. Services are already running!

Check status:
```bash
docker ps
```

### 2. Start the backend

```bash
cd backend
npm run dev
```

Expected output:
```
✅ MongoDB connected
✅ Kafka connected — producer & consumer running
🚀 Server running on port 5000
```

### 3. Open the app

**Browser:** http://localhost:5000  
**Kafka UI:** http://localhost:8080

---

## 🔧 Quick Commands

### View all services
```bash
docker-compose ps
```

### Stop services
```bash
docker-compose stop
```

### Start services
```bash
docker-compose start
```

### View logs
```bash
docker-compose logs -f
```

### Restart everything
```bash
docker-compose restart
```

---

## 📝 Configuration

### Environment (.env)
- MongoDB: `mongodb://localhost:27017/ravensync`
- Kafka: `localhost:9092`
- Port: `5000`

### Docker Volumes
- `ravensync_mongodb_data` - Database storage
- `ravensync_kafka_data` - Kafka message storage

---

## 🌐 Offline Mode

✅ **Fully operational without internet**
- All services run locally in Docker
- No external dependencies
- Data persists in Docker volumes
- Perfect for air-gapped environments

---

## 🧪 Testing

### Test Kafka connection
```bash
# Windows
test-kafka.bat

# Manual
cd backend
node -e "require('dotenv').config(); const {connectKafka} = require('./services/messagingService'); connectKafka();"
```

### Send test alert
1. Open http://localhost:5000
2. Login as admin
3. Create an emergency alert
4. Check Kafka UI at http://localhost:8080 to see the message

---

## 📚 Documentation

- **Quick Start:** `QUICK-START.md`
- **Kafka Setup:** `README-KAFKA.md`
- **Main README:** `README.md`

---

## ✨ What's Next?

1. ✅ Services are running
2. ✅ Kafka topics created
3. ✅ Connection tested
4. 🎯 **Start the backend:** `cd backend && npm run dev`
5. 🎯 **Open the app:** http://localhost:5000

**You're ready to use RavenSync offline!** 🚀
