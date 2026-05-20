# 🦅 RavenSync — Enterprise Emergency Communication Platform

> Real-time emergency communication, smart notification, and disaster response management platform for schools, universities, barangays, offices, and local communities.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Docker (optional — for Kafka + RabbitMQ + MongoDB containers)
- Kafka or RedPanda (optional — falls back to offline queue automatically)
- RabbitMQ (optional — falls back to synchronous processing automatically)

### Installation

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Configure environment
# Edit backend/.env with your MongoDB URI

# 3. Seed demo data (creates default admin account + channels)
node scripts/seed.js

# 4. Start the server
npm run dev
```

Open: **http://localhost:5000**

### Running with Docker (Offline / Local Demo)

```powershell
# Start MongoDB + Kafka + Kafka UI
docker compose up -d

# Stop all containers
docker compose down

# Stop and wipe all data (fresh start)
docker compose down -v
```

Services started by Docker:
| Container | Image | Port |
|-----------|-------|------|
| ravensync-mongo | mongo:7.0 | 27017 |
| ravensync-kafka | apache/kafka:3.7.0 | 9092 |
| ravensync-kafka-ui | provectuslabs/kafka-ui | 8080 |
| ravensync-rabbitmq | rabbitmq:3.13-management | 5672, 15672 |

> Kafka UI available at **http://localhost:8080** — monitor topics and messages.
> RabbitMQ Management UI available at **http://localhost:15672** — monitor queues and consumers (login: `guest` / `guest`).

---

## 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |

> Login uses **username**, not email.
> To change credentials, edit `backend/scripts/seed.js` and re-run `node scripts/seed.js`.

---

## 🏗️ Architecture

```
RavenSync/
├── backend/
│   ├── controllers/        # MVC Controllers
│   ├── models/             # MongoDB Models
│   │   ├── AdminPin.js     # Admin map pins (DB-persisted)
│   │   └── LocationPin.js  # User location pins
│   ├── routes/             # Express Routes
│   ├── middlewares/        # Auth, Error, Audit
│   ├── services/           # WebSocket, Kafka, RabbitMQ, XML
│   ├── config/             # DB, Logger
│   ├── xml/                # Generated XML Files
│   ├── xslt/               # XSLT Stylesheets
│   ├── scripts/            # PowerShell Automation + seed.js
│   ├── backups/db/         # Database Backup ZIPs
│   ├── logs/               # Application Logs
│   ├── nodemon.json        # Nodemon watch config
│   └── server.js           # Entry Point
├── frontend/
│   └── public/
│       ├── css/            # Custom CSS (light + dark theme)
│       ├── js/
│       │   ├── pages/      # Page Components
│       │   ├── services/   # API, WebSocket, Auth, Theme, Notifications
│       │   ├── components/ # Sidebar, NotificationBell
│       │   ├── utils/      # Helpers, Toast
│       │   └── app.js      # SPA Router
│       └── index.html      # Entry Point
└── docker-compose.yml      # MongoDB + Kafka + RabbitMQ + UIs
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt (12 rounds) |
| Real-time | WebSocket (ws) |
| Messaging (Broadcast) | Kafka / RedPanda (kafkajs) + offline queue fallback |
| Messaging (Task Queue) | RabbitMQ (amqplib) + sync fallback |
| XML | xml2js (DOM + SAX), xmlbuilder2 |
| XSLT | Custom transformation engine |
| Frontend | Vanilla JS (ES Modules), Tailwind CSS |
| Charts | Chart.js |
| Automation | PowerShell scripts + node-cron |
| PWA | Service Worker + Web Manifest |
| Theming | CSS variables — light default, dark optional |
| Containers | Docker + Docker Compose |

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login (username + password)
- `GET /api/auth/me` — Get current user

### Alerts
- `GET /api/alerts` — List alerts (with filters)
- `POST /api/alerts` — Create alert (admin/superadmin)
- `PATCH /api/alerts/:id/resolve` — Resolve alert
- `GET /api/alerts/stats` — Alert statistics

### Channels
- `GET /api/channels` — List channels
- `POST /api/channels` — Create channel
- `PATCH /api/channels/:id` — Edit channel (admin/superadmin)
- `DELETE /api/channels/:id` — Delete channel (admin/superadmin)
- `GET /api/channels/:id/messages` — Get messages
- `POST /api/channels/:id/messages` — Send message
- `PATCH /api/channels/messages/:msgId` — Edit message (own or admin)
- `DELETE /api/channels/messages/:msgId` — Delete message (own or admin)

### Map
- `GET /api/map/admin-pins` — Get all admin pins (all authenticated users)
- `POST /api/map/admin-pins` — Create admin pin (admin/superadmin)
- `DELETE /api/map/admin-pins/:id` — Delete admin pin (admin/superadmin)
- `DELETE /api/map/admin-pins` — Clear all admin pins (admin/superadmin)
- `GET /api/map/pins` — Get all user location pins (admin/superadmin)
- `POST /api/map/pins` — Save/update current user's location pin
- `DELETE /api/map/pins/:userId` — Delete a user's location pin

### XML
- `GET /api/xml/alerts` — Export alerts as XML
- `GET /api/xml/users` — Export users as XML (admin+)
- `GET /api/xml/logs` — Export audit logs as XML (admin+)
- `GET /api/xml/report` — Generate XML report
- `POST /api/xml/parse` — DOM parse XML content
- `POST /api/xml/parse/sax` — SAX parse XML content
- `POST /api/xml/transform` — XSLT transform (html/json)
- `GET /api/xml/files` — List saved XML files
- `GET /api/xml/files/:filename` — Get XML file content

### System
- `GET /api/system/queue-stats` — Kafka + RabbitMQ queue stats
- `GET /api/system/system-health` — System health
- `GET /api/system/scripts` — List automation scripts
- `POST /api/system/scripts/:id/run` — Execute script (admin+)
- `GET /api/system/backups` — List database backups

### Admin
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/users` — List users
- `POST /api/admin/users` — Create user (superadmin)
- `PUT /api/admin/users/:id` — Update user
- `DELETE /api/admin/users/:id` — Permanently delete user (superadmin)
- `GET /api/admin/audit-logs` — Audit trail
- `GET /api/admin/word-filter` — Get filtered words
- `POST /api/admin/word-filter` — Add word to filter (superadmin)
- `DELETE /api/admin/word-filter/:id` — Remove word from filter (superadmin)

### Announcements
- `GET /api/announcements` — List announcements
- `POST /api/announcements` — Create announcement (admin+)
- `PATCH /api/announcements/:id/read` — Mark as read
- `DELETE /api/announcements/:id` — Delete (admin+)

---

## 🗺️ Campus Map Features
- Interactive map with **scroll-to-zoom**, **pinch-to-zoom** (mobile), and **drag-to-pan**
- Zoom in/out buttons + reset button
- Admin can place pins: Exit 🚪, Hazard ⚠️, Assembly Area 🏁, First Aid 🏥
- **Admin pins are saved to MongoDB** and visible to all users in real-time
- Users can share their location by clicking on the map
- Admin sees all user locations live with name and timestamp
- **Guide User** — admin can send directional messages to specific users with quick presets or custom text
- Users receive a prominent alert banner when admin sends guidance
- Live updates via WebSocket — no refresh needed
- WebSocket listeners are cleaned up on page navigation to prevent memory leaks

---

## 💬 Channel Features
- 4 default channels: Emergency Response Network, Emergency Broadcasts, General Announcements, Community Safety Hub
- Admin/superadmin can **edit** and **delete** any channel (hover to reveal buttons)
- Admin/superadmin can **edit** and **delete** any message
- Regular users can only edit/delete their own messages
- Profanity filter with warning system — 3 warnings → muted (5/10/15 min escalating)
- Rate limiting — 5 seconds between messages for regular users
- Reply-to-message support
- Real-time delivery via WebSocket

---

## 👥 User Management
- Superadmin can create, deactivate/activate, and **permanently delete** users
- Accessible via **Manage Users** in the sidebar
- Role options: `superadmin`, `admin` (Instructor), `user` (Student)
- Word filter manager — block custom words from all channels

---

## 🐇 RabbitMQ — Task Queue

RabbitMQ runs alongside Kafka and handles point-to-point task dispatch:

| Queue | Purpose | Why RabbitMQ (not Kafka) |
|-------|---------|-------------------------|
| `audit.logs` | Async audit log writes to MongoDB | Non-blocking — response goes out immediately, worker writes the log |
| `announcements` | Notification dispatch on announcement create | Guaranteed once-delivery per task |
| `guide.user` | Admin-to-user directional guidance | Point-to-point routing to one specific user |

**Kafka vs RabbitMQ in RavenSync:**
| Scenario | Kafka | RabbitMQ |
|----------|-------|----------|
| New alert → broadcast to ALL users | ✅ | |
| Audit log → write to DB async | | ✅ |
| Announcement → dispatch notification | | ✅ |
| Guide specific user → guaranteed delivery | | ✅ |

Both run fully offline via Docker. RabbitMQ falls back to synchronous processing if unavailable — zero breaking changes.

---

## 🔐 Security Features
- JWT Bearer token authentication (7d expiry)
- bcrypt password hashing (12 rounds)
- Rate limiting — 500 req/15min for auth routes, 100 req/15min for all others
- MongoDB injection sanitization
- Helmet security headers
- Role-based access control (superadmin / admin / user)
- Auto-logout on expired/invalid token
- Comprehensive audit logging

---

## 📄 XML & XSLT
- Structured XML for alerts, users, audit logs, reports
- DOM parsing via xml2js — full object tree
- SAX parsing via sax module — event-driven (openTag, closeTag, text)
- XSLT transformation to styled HTML table report or JSON
- Automated XML backups via PowerShell
- Live XML preview in browser

---

## 🤖 Automation Scripts (PowerShell)

All scripts are executable from the **Automation Center** in the web UI.

| Script | Purpose |
|--------|---------|
| xml-backup.ps1 | Backup XML files to timestamped ZIP |
| xml-transform.ps1 | XSLT transformation of XML files |
| health-check.ps1 | Full system diagnostics (Node, MongoDB, disk, memory) |
| log-cleanup.ps1 | Remove log files older than 30 days |
| queue-consumer.ps1 | Start Kafka message consumer |
| report-gen.ps1 | Generate analytics reports |
| db-backup.ps1 | Export all MongoDB collections to ZIP archive |
| db-restore.ps1 | Restore MongoDB from latest backup (non-interactive) |
| notify-process.ps1 | Process and dispatch pending notifications |

### Database Backup & Restore

```powershell
# Backup (also available via Automation Center UI)
cd backend
powershell -File scripts/db-backup.ps1

# Restore latest backup
powershell -File scripts/db-restore.ps1 -Latest -Force

# Restore specific backup
powershell -File scripts/db-restore.ps1 -BackupFile ".\backups\db\db_backup_20250515_143734.zip" -Force
```

---

## ☁️ Production Deployment (Render + MongoDB Atlas + RedPanda)

### Services Used
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Render | Node.js hosting | Yes (spins down after 15min idle) |
| MongoDB Atlas | Database | M0 Free (512MB) |
| RedPanda Cloud | Kafka-compatible message broker | Serverless free (10GB/month) |

### Environment Variables (Render)

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/ravensync` |
| `JWT_SECRET` | any long random string |
| `KAFKA_BROKERS` | `seed-xxx.cloud.redpanda.com:9092` |
| `KAFKA_SASL_USERNAME` | your RedPanda username |
| `KAFKA_SASL_PASSWORD` | your RedPanda password |
| `FRONTEND_URL` | `https://your-app.onrender.com` |
| `RABBITMQ_URL` | `amqp://localhost:5672` (local) or CloudAMQP URL (production) |

### RedPanda Cloud Setup
RedPanda is a Kafka-API compatible broker — `kafkajs` connects to it with no code changes, just SASL credentials:
- SASL mechanism: `scram-sha-256`
- SSL: enabled automatically when `KAFKA_SASL_USERNAME` is set
- Required topics: `emergency.alerts`, `notifications`, `broadcasts`, `dead.letter`

### Seeding the Database on Production
Run locally pointing to Atlas (requires mobile hotspot if on Globe WiFi — SRV DNS is blocked):
```powershell
cd backend
$env:MONGODB_URI="mongodb+srv://<user>:<pass>@cluster.mongodb.net/ravensync"
node scripts/seed.js
```

---

## 🌗 Light & Dark Mode
- **Light mode** is the default — clean white UI, high contrast for bright environments
- **Dark mode** is optional — deep black backgrounds (`#0a0a0f`), vivid accent colors
- Toggle via the **sidebar button** (moon/sun icon) — preference saved in localStorage
- Also toggleable from the **landing page navbar**

---

## 🔔 Notifications
- In-app notification bell with unread badge
- Notifications for: new alerts, announcements, messages, student help requests
- **Mark all read** and **Clear all** buttons
- Notifications auto-clear when server restarts (WebSocket reconnect detection)

---

## 📱 PWA Features
- Installable on mobile/desktop
- Offline caching via Service Worker
- Push notification support
- Background sync

---

## 🛠️ Development Notes

### Seed Script (`backend/scripts/seed.js`)
- Wipes all users, alerts, and channels then recreates them from scratch
- Only one account is created by default: `admin / admin123` (superadmin)
- To add more users or channels, edit the seed file — comments explain each section
- **Warning:** Running seed on production will delete all existing data

### Default Channels After Seed
| Channel | Type | Who Can Post |
|---------|------|-------------|
| Emergency Response Network | emergency | Admin only |
| 🚨 Emergency Broadcasts | emergency | Admin only |
| General Announcements | broadcast | Admin only |
| Community Safety Hub | public | Everyone |

### Nodemon Configuration
`nodemon.json` watches only source directories and ignores `backups/`, `logs/`, `xml/`, `scripts/`, and temp files to prevent server restarts during script execution.

### MongoDB ObjectId Note
Always use `node scripts/seed.js` to create users. Manual insertion must use `new mongoose.Types.ObjectId()` for `_id` — plain string IDs will break Mongoose's `save()` and `findById()`.

### Why MongoDB Instead of XML as Database
XML is used as the **data exchange and reporting format** in RavenSync — not as the primary database. MongoDB was chosen for storage because:
- RavenSync is a **multi-user real-time platform** — during an emergency, 50+ users connect simultaneously
- Concurrent writes to the same XML file cause **file corruption** — two users logging in at the same time would overwrite each other's data
- MongoDB handles concurrent access safely with **atomic operations**
- XML files have no indexing — querying 1000 alerts by severity/status requires reading the entire file every time
- File corruption during an actual emergency is unacceptable

XML is still central to RavenSync — all emergency data (alerts, users, audit logs, reports) is **exported, stored, and processed as XML** via DOM parsing, SAX parsing, and XSLT transformation.

### Offline Mode
- Kafka/RedPanda is optional — if unavailable, messages queue locally and flush when connection is restored
- RabbitMQ is optional — if unavailable, audit logs write synchronously and guide-user falls back to direct WebSocket
- WebSocket reconnects automatically every 3 seconds on disconnect
- PWA service worker caches static assets for offline viewing

---

*RavenSync — Inspired by ravens, known for delivering messages and signaling danger.*
