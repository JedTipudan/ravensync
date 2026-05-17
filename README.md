# 🦅 RavenSync — Enterprise Emergency Communication Platform

> Real-time emergency communication, smart notification, and disaster response management platform for schools, universities, barangays, offices, and local communities.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Kafka (optional — falls back to offline queue automatically)

### Installation

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Configure environment
# Edit backend/.env with your MongoDB URI

# 3. Seed demo data
node scripts/seed.js

# 4. Start the server
npm run dev
```

Open: **http://localhost:5000**

---

## 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |
| User | jed | jed123 |

> Login uses **username**, not email.

---

## 🏗️ Architecture

```
RavenSync/
├── backend/
│   ├── controllers/        # MVC Controllers
│   ├── models/             # MongoDB Models
│   ├── routes/             # Express Routes
│   ├── middlewares/        # Auth, Error, Audit
│   ├── services/           # WebSocket, Kafka, XML
│   ├── config/             # DB, Logger
│   ├── xml/                # Generated XML Files
│   ├── xslt/               # XSLT Stylesheets
│   ├── scripts/            # PowerShell Automation
│   ├── backups/db/         # Database Backup ZIPs
│   ├── logs/               # Application Logs
│   ├── nodemon.json        # Nodemon watch config
│   └── server.js           # Entry Point
└── frontend/
    └── public/
        ├── css/            # Custom CSS (light + dark theme)
        ├── js/
        │   ├── pages/      # Page Components
        │   ├── services/   # API, WebSocket, Auth, Theme, Notifications
        │   ├── components/ # Sidebar, NotificationBell
        │   ├── utils/      # Helpers, Toast
        │   └── app.js      # SPA Router
        └── index.html      # Entry Point
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt (12 rounds) |
| Real-time | WebSocket (ws) |
| Messaging | Kafka (kafkajs) + offline queue fallback |
| XML | xml2js (DOM + SAX), xmlbuilder2 |
| XSLT | Custom transformation engine |
| Frontend | Vanilla JS (ES Modules), Tailwind CSS |
| Charts | Chart.js |
| Automation | PowerShell scripts + node-cron |
| PWA | Service Worker + Web Manifest |
| Theming | CSS variables — light default, dark optional |

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
- `GET /api/channels/:id/messages` — Get messages
- `POST /api/channels/:id/messages` — Send message

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
- `GET /api/system/queue-stats` — Kafka queue stats
- `GET /api/system/system-health` — System health
- `GET /api/system/scripts` — List automation scripts
- `POST /api/system/scripts/:id/run` — Execute script (admin+)
- `GET /api/system/backups` — List database backups

### Admin
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/users` — User management
- `GET /api/admin/audit-logs` — Audit trail

### Announcements
- `GET /api/announcements` — List announcements
- `POST /api/announcements` — Create announcement (admin+)
- `PATCH /api/announcements/:id/read` — Mark as read
- `DELETE /api/announcements/:id` — Delete (admin+)

---

## 🔐 Security Features
- JWT Bearer token authentication (7d expiry)
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
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

Backups are saved to `backend/backups/db/` as timestamped ZIP files and visible in the **Database Backups** panel in the Automation Center.

---

## 🌗 Light & Dark Mode
- **Light mode** is the default — clean white UI, high contrast for bright environments
- **Dark mode** is optional — deep black backgrounds (`#0a0a0f`), vivid accent colors, readable even in a completely dark room
- Toggle via the **sidebar button** (moon/sun icon) — preference saved in localStorage
- Also toggleable from the **landing page navbar**

---

## 🔔 Notifications
- In-app notification bell with unread badge
- Notifications for: new alerts, announcements, messages, student help requests
- **Mark all read** and **Clear all** buttons
- Notifications auto-clear when server restarts (WebSocket reconnect detection)
- Desktop panel: 420px wide solid dark background
- Mobile panel: same style, anchored to right edge

---

## 📱 PWA Features
- Installable on mobile/desktop
- Offline caching via Service Worker
- Push notification support
- Background sync

---

## 🛠️ Development Notes

### Nodemon Configuration
`nodemon.json` watches only source directories and ignores `backups/`, `logs/`, `xml/`, `scripts/`, and temp files (`_rs_*.js`) to prevent server restarts during script execution.

### Known Credentials After Fresh Seed
```
superadmin → username: admin    password: admin123
user       → username: student  password: student123
```

### MongoDB ObjectId Note
Always use `node scripts/seed.js` to create users. Manual insertion must use `new mongoose.Types.ObjectId()` for `_id` — plain string IDs will break Mongoose's `save()` and `findById()`.

---

*RavenSync — Inspired by ravens, known for delivering messages and signaling danger.*
