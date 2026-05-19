# RavenSync - Kafka Setup Guide

## Running Kafka Locally (Offline)

This guide helps you run RavenSync with Kafka completely offline using Docker.

## Prerequisites

- **Docker Desktop** installed and running
- No internet required after initial image download

## Quick Start

### 1. Start Kafka + MongoDB

```bash
# From the RavenSync root directory
docker-compose up -d
```

This starts:
- **MongoDB** on `localhost:27017`
- **Kafka** on `localhost:9092`
- **Kafka UI** on `http://localhost:8080` (optional monitoring dashboard)

### 2. Verify Services

```bash
# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f kafka
docker-compose logs -f mongodb
```

### 3. Start RavenSync Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ Kafka connected — producer & consumer running
```

## Managing Services

### Stop Services
```bash
docker-compose stop
```

### Start Services
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

## Kafka UI Dashboard

Access the Kafka UI at **http://localhost:8080** to:
- View topics and messages
- Monitor consumer groups
- Check broker health
- Inspect message content

## Kafka Topics

RavenSync automatically creates these topics:
- `emergency.alerts` - Critical emergency notifications
- `notifications` - General user notifications
- `broadcasts` - System-wide announcements
- `dead.letter` - Failed message handling

## Troubleshooting

### Kafka won't start
```bash
# Check logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka
```

### Port conflicts
If ports 9092, 27017, or 8080 are in use:
1. Stop conflicting services
2. Or modify ports in `docker-compose.yml`

### Reset everything
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Offline Operation

Once Docker images are downloaded, everything runs **completely offline**:
- No internet connection needed
- All data stored locally
- Perfect for air-gapped environments

## Performance Tips

- Kafka uses ~512MB RAM by default
- MongoDB uses ~1GB RAM by default
- Adjust in `docker-compose.yml` if needed

## Production Notes

For production deployment:
- Increase replication factors
- Add authentication (SASL/SSL)
- Configure proper retention policies
- Use external volumes for data persistence
- Set up monitoring and alerting

## Testing Kafka

### Send a test message (from backend directory)
```bash
node _rs_consumer_tmp.js
```

Then trigger an alert from the RavenSync UI to see messages flowing through Kafka.
