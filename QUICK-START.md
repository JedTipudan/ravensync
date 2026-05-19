# RavenSync - Quick Start Guide (Offline Mode)

## 🚀 Get Started in 3 Steps

### Step 1: Start Services (MongoDB + Kafka)

**Double-click:** `start-services.bat`

Or run manually:
```bash
docker-compose up -d
```

Wait ~30 seconds for services to initialize.

### Step 2: Start Backend

Open a new terminal:
```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ MongoDB connected
✅ Kafka connected — producer & consumer running
🚀 Server running on port 5000
```

### Step 3: Open RavenSync

Open your browser: **http://localhost:5000**

---

## 📊 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **RavenSync App** | http://localhost:5000 | Main application |
| **Kafka UI** | http://localhost:8080 | Monitor Kafka topics & messages |
| **MongoDB** | mongodb://localhost:27017 | Database |
| **Kafka Broker** | localhost:9092 | Message broker |

---

## 🛠️ Common Commands

### View Service Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kafka
docker-compose logs -f mongodb
```

### Stop Services
```bash
docker-compose stop
```

### Start Services Again
```bash
docker-compose start
```

### Restart Services
```bash
docker-compose restart
```

### Stop and Remove Everything
```bash
docker-compose down
```

### Stop and Remove Everything (including data)
```bash
docker-compose down -v
```

---

## 🧪 Test Kafka Connection

**Double-click:** `test-kafka.bat`

Or run manually:
```bash
cd backend
node -e "const {connectKafka} = require('./services/messagingService'); connectKafka();"
```

---

## 📝 Kafka Topics

RavenSync automatically creates these topics:

- `emergency.alerts` - Critical emergency notifications
- `notifications` - General user notifications  
- `broadcasts` - System-wide announcements
- `dead.letter` - Failed message handling

View them in **Kafka UI**: http://localhost:8080

---

## 🔧 Troubleshooting

### "Port already in use" error

Check what's using the ports:
```bash
netstat -ano | findstr "27017"
netstat -ano | findstr "9092"
```

Stop conflicting services:
```bash
docker stop ravensync-mongo
docker-compose down
docker-compose up -d
```

### Kafka shows "unhealthy" but works

This is normal! The healthcheck is strict. If your backend connects successfully, Kafka is working fine.

### Backend can't connect to Kafka

1. Check Docker services are running:
   ```bash
   docker ps
   ```

2. Restart Kafka:
   ```bash
   docker-compose restart kafka
   ```

3. Check Kafka logs:
   ```bash
   docker logs ravensync-kafka --tail 50
   ```

### Reset everything

```bash
docker-compose down -v
docker-compose up -d
cd backend
npm run dev
```

---

## 🌐 Offline Operation

Once Docker images are downloaded, **everything runs completely offline**:

✅ No internet connection needed  
✅ All data stored locally  
✅ Perfect for air-gapped environments  
✅ Kafka + MongoDB run in Docker containers  

---

## 📦 What's Running?

- **MongoDB 7.0** - Database for users, messages, alerts
- **Apache Kafka 3.7.0** - Message broker (KRaft mode, no Zookeeper)
- **Kafka UI** - Web interface for monitoring
- **Node.js Backend** - Express API server
- **Static Frontend** - HTML/CSS/JS served by Express

---

## 🎯 Next Steps

1. **Create an account** at http://localhost:5000
2. **Send test alerts** to see Kafka in action
3. **Monitor messages** in Kafka UI at http://localhost:8080
4. **Check logs** to see message flow

---

## 📚 More Information

- Full Kafka setup guide: `README-KAFKA.md`
- Project documentation: `README.md`
- API documentation: Check `/api` endpoints

---

## 🆘 Need Help?

1. Check service status: `docker-compose ps`
2. View logs: `docker-compose logs -f`
3. Test Kafka: Run `test-kafka.bat`
4. Restart everything: `docker-compose restart`

**Everything working?** You're ready to use RavenSync offline! 🎉
