# RavenSync — Study Guide for Instructor Q&A

---

## 1. What is RavenSync and what problem does it solve?

RavenSync is a real-time emergency communication platform for schools, universities, barangays, and offices. It solves the problem of slow, fragmented emergency response by centralizing alerts, live location tracking, messaging channels, and automated notifications into one system. The name is inspired by ravens — birds historically used to deliver messages and signal danger.

---

## 2. Architecture & Design Pattern

**Pattern used: MVC (Model-View-Controller)**

| Layer | Location | Role |
|---|---|---|
| Model | `backend/models/` | MongoDB schemas via Mongoose |
| View | `frontend/public/` | Vanilla JS SPA (no framework) |
| Controller | `backend/controllers/` | Business logic per feature |

The frontend is a **Single Page Application (SPA)** — `app.js` acts as the router, swapping page content without full reloads using `window.history.pushState`.

---

## 3. Tech Stack — Why Each Was Chosen

| Technology | Why |
|---|---|
| Node.js + Express | Non-blocking I/O — ideal for real-time apps with many concurrent connections |
| MongoDB + Mongoose | Schema-flexible NoSQL — good for varied alert/message structures |
| JWT (JSON Web Token) | Stateless auth — no server-side session storage needed |
| bcrypt (12 rounds) | Industry-standard password hashing; 12 rounds balances security vs. speed |
| WebSocket (`ws`) | Full-duplex real-time communication — alerts and messages push instantly |
| Kafka / RedPanda | Durable broadcast message queue — fan-out alerts to all consumers, replayable |
| RabbitMQ (amqplib) | Task queue — async audit log writes, announcement dispatch, guaranteed guide-user delivery |
| xml2js + sax | Two XML parsing strategies: DOM (full tree) and SAX (event-driven, memory-efficient) |
| Tailwind CSS | Utility-first CSS — fast styling without writing custom CSS classes |
| Docker Compose | Reproducible local dev environment — one command starts MongoDB + Kafka + RabbitMQ |

### Why MongoDB Instead of XML as Database

XML is the **data exchange and reporting format** in RavenSync — not the primary database. MongoDB was chosen because:

| Problem with XML as DB | Why it matters in RavenSync |
|---|---|
| No concurrent write protection | 50+ users connecting simultaneously during an emergency corrupts the file |
| No atomic operations | A server crash mid-write leaves XML in a broken/unreadable state |
| Full file read on every query | Reading all alerts just to find one by severity is slow |
| No indexing | Can't efficiently filter by status, severity, date |
| No relationships | Manually resolving user → alert → channel across multiple files |

XML is still central — all emergency data is **exported, parsed (DOM + SAX), and transformed (XSLT)** as XML. MongoDB is the write-safe storage layer behind it.

---

## 4. Authentication & Authorization

### How login works (step by step):
1. Client sends `POST /api/auth/login` with `{ username, password }`
2. Server finds user by username, fetches password field (normally excluded via `select: false`)
3. `bcrypt.compare()` checks the candidate password against the stored hash
4. If valid, `jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })` generates a token
5. Token is returned to the client and stored in `localStorage`
6. Every subsequent request sends `Authorization: Bearer <token>` in the header

### How the `protect` middleware works:
```
Request → extract Bearer token → jwt.verify() → find user in DB → attach to req.user → next()
```
If token is missing, expired, or user is inactive → `401 Unauthorized`

### Role-Based Access Control (RBAC):
- `superadmin` — full access (create/delete users, word filter)
- `admin` — manage alerts, channels, messages, map pins
- `user` — read channels, send messages in public channels, share location

The `authorize(...roles)` middleware checks `req.user.role` against allowed roles.

---

## 5. Real-Time Communication — WebSocket

**File:** `backend/services/websocketService.js`

### Connection flow:
1. Client connects to `ws://localhost:5000/ws?token=<JWT>`
2. Server verifies the JWT from the query string
3. Authenticated user is stored in a `Map<userId, ws>` called `clients`
4. Server sends `{ type: 'CONNECTED' }` confirmation

### Key WebSocket message types:
| Type | Direction | Purpose |
|---|---|---|
| `SUBSCRIBE_CHANNEL` | Client → Server | Join a channel room |
| `NEW_ALERT` | Server → All | Broadcast new emergency alert |
| `NEW_MESSAGE` | Server → Channel subscribers | Real-time chat message |
| `LOCATION_SHARE` | Client → Server → Admins | User shares map position |
| `GUIDE_USER` | Admin → Specific user | Send directional guidance |
| `CHAT_WARNING` | Server → User | Profanity warning notification |
| `HEARTBEAT` | Server → All | Keep-alive every 30 seconds |
| `PING` / `PONG` | Both | Connection health check |

### Why WebSocket over HTTP polling?
- HTTP polling wastes bandwidth — client asks "anything new?" repeatedly
- WebSocket keeps one persistent connection — server pushes data only when it exists
- Critical for emergencies where every second matters

---

## 6. Kafka / Message Queue

**File:** `backend/services/messagingService.js`

### Topics used:
| Topic | Purpose |
|---|---|
| `emergency.alerts` | New emergency alerts |
| `notifications` | User notifications |
| `broadcasts` | Channel broadcasts |
| `dead.letter` | Failed messages for retry/inspection |

### Offline Queue Fallback:
If Kafka is unavailable, messages go into an in-memory `offlineQueue` array. When Kafka reconnects, `_flushOfflineQueue()` sends all pending messages. This ensures **zero message loss**.

### Why Kafka?
- **Durability** — messages persist on disk, survive server restarts
- **Decoupling** — producer (alert creator) and consumer (notification sender) are independent
- **Fan-out** — one alert published to a topic reaches ALL consumers simultaneously
- **Replayable** — consumers can rewind and re-read past messages using offsets

### RedPanda Cloud (Production):
RedPanda is Kafka-API compatible. The only difference is SASL/SSL credentials in the config — no code changes needed.

---

## 6b. RabbitMQ — Task Queue

**File:** `backend/services/rabbitMQService.js`

### Queues used:
| Queue | Purpose | Why RabbitMQ |
|---|---|---|
| `audit.logs` | Async audit log writes to MongoDB | Non-blocking — response goes out immediately, worker writes the log |
| `announcements` | Notification dispatch when announcement is created | Guaranteed once-delivery per task |
| `guide.user` | Admin-to-user directional guidance delivery | Point-to-point routing to one specific user |

### How it works:
1. `connectRabbitMQ()` connects to `amqp://localhost:5672` and declares all queues as **durable** (survive broker restart)
2. `publish(queue, payload)` sends a message with `persistent: true` — survives RabbitMQ restart
3. `consume(queue, handler)` registers a worker that processes messages and calls `channel.ack()` after success
4. If the handler throws, `channel.nack()` discards the message — prevents infinite retry loops
5. Falls back gracefully — if RabbitMQ is down, audit logs write synchronously, guide-user falls back to direct WebSocket

### Kafka vs RabbitMQ — Why Both?
| Scenario | Kafka | RabbitMQ |
|---|---|---|
| New alert → broadcast to ALL users | ✅ fan-out | ❌ duplicates |
| Audit log → write to DB async | ❌ overkill | ✅ task queue |
| Announcement → dispatch notification | ❌ | ✅ once-delivery |
| Guide specific user | ❌ | ✅ point-to-point |
| Replay past messages | ✅ | ❌ deleted after consume |

> **Key insight:** Kafka is a log/stream — messages are stored and many consumers can read the same message. RabbitMQ is a post office — a message is delivered to one worker then deleted. They solve different problems.

---

## 7. XML & XSLT

**File:** `backend/services/xmlService.js`

### Two XML parsing approaches:

**DOM Parsing (xml2js):**
- Loads the entire XML into memory as a JavaScript object tree
- Good for small documents where you need random access to any element
- Used in: `POST /api/xml/parse`

**SAX Parsing (sax module):**
- Event-driven — fires callbacks for `openTag`, `closeTag`, `text`
- Never loads the full document — memory efficient for large files
- Used in: `POST /api/xml/parse/sax`

### XSLT Transformation:
- `POST /api/xml/transform` converts XML to either HTML table report or JSON
- The HTML output uses inline CSS to render a styled report viewable in the browser
- Demonstrates separation of data (XML) from presentation (XSLT/HTML)

### XML Namespaces used:
- `http://ravensync.io/alert` — single alert
- `http://ravensync.io/alerts` — alert list
- `http://ravensync.io/users` — user export
- `http://ravensync.io/logs` — audit logs
- `http://ravensync.io/report` — analytics report

---

## 8. Database Models (MongoDB Schemas)

### User model highlights:
- `password` has `select: false` — never returned in queries unless explicitly requested
- `pre('save')` hook auto-hashes password with bcrypt before storing
- `toJSON()` method strips the password field from any JSON response
- `mutedUntil` and `chatWarnings` track profanity violations

### Alert model highlights:
- `severity`: `critical | high | medium | low`
- `status`: `active | resolved | scheduled | draft`
- `type`: `emergency | warning | info | drill | announcement | weather | security`
- Compound indexes on `(status, severity, createdAt)` for fast filtered queries
- Stores `xmlData` (generated XML) and `qrCode` (base64 data URL) per alert

### Channel model highlights:
- `type`: `public | private | emergency | broadcast`
- `lockedDuringEmergency` — prevents regular users from posting during active alerts
- Emergency and broadcast channels are admin-only by default

---

## 9. Security Features — Explain Each

| Feature | Implementation | Why |
|---|---|---|
| JWT auth | `jsonwebtoken`, 7-day expiry | Stateless, scalable auth |
| bcrypt hashing | 12 rounds | Slow enough to resist brute force |
| Rate limiting | `express-rate-limit` — 100 req/15min general, 500 for auth | Prevents DoS and brute force |
| MongoDB sanitization | `express-mongo-sanitize` | Prevents NoSQL injection (`$where`, `$gt` attacks) |
| Helmet | `helmet` middleware | Sets secure HTTP headers (XSS, clickjacking, etc.) |
| RBAC | `authorize()` middleware | Least-privilege access per role |
| Audit logging | `auditLogger` middleware | Tracks every sensitive action with user, IP, timestamp |
| Auto-logout | Frontend checks 401 responses | Expired tokens force re-login |

---

## 10. Profanity Filter System

**File:** `backend/utils/profanityFilter.js`

### How it works:
1. Base word list (English + Filipino) is hardcoded
2. Custom words are loaded from MongoDB `FilteredWord` collection at startup
3. Each word is converted to a regex that handles leet-speak substitutions:
   - `a` → `[a@4]`, `e` → `[e3]`, `i` → `[i1!]`, `o` → `[o0]`, `s` → `[s$5]`
4. `containsProfanity(text)` — returns boolean
5. `censorText(text)` — replaces matches with `####`

### Warning/Mute escalation:
| Warnings | Action |
|---|---|
| 1–2 | Warning only, no mute |
| 3 | Muted 5 minutes |
| 4 | Muted 10 minutes |
| 5+ | Muted 15 minutes each time |

The user is notified via WebSocket (`CHAT_WARNING` event) in real-time.

---

## 11. SPA Router (Frontend)

**File:** `frontend/public/js/app.js`

The frontend uses **no framework** — pure Vanilla JS ES Modules.

### How routing works:
1. `routes` object maps URL paths to render functions
2. `navigate(path)` calls `history.pushState()` then calls the matching render function
3. `popstate` event handles browser back/forward buttons
4. `requireAuth()` checks localStorage for a JWT before rendering protected pages
5. Role-based route guard: `/users` requires `superadmin` or `admin`

### Why no React/Vue?
- Demonstrates understanding of fundamentals without framework abstraction
- Lighter bundle — no framework overhead
- Suitable for a focused academic project

---

## 12. Audit Logging

**File:** `backend/middlewares/auditLogger.js`

### How it works:
- Wraps `res.json()` — intercepts the response after the controller runs
- Logs: `action`, `resource`, `user`, `IP address`, `HTTP method`, `request body`, `status (success/failure)`
- Applied as middleware on sensitive routes: `auditLogger('CREATE_ALERT', 'Alert')`
- Stored in MongoDB `AuditLog` collection, exportable as XML

---

## 13. Campus Map Feature

### Admin pins (persistent):
- Stored in MongoDB `AdminPin` collection
- Types: Exit 🚪, Hazard ⚠️, Assembly Area 🏁, First Aid 🏥
- Visible to all authenticated users in real-time via WebSocket

### User location pins (session-based):
- Stored in `LocationPin` collection (upserted — one pin per user)
- When a user clicks the map, coordinates are sent via WebSocket `LOCATION_SHARE`
- Server saves to DB and broadcasts to all admin clients
- Admin can send `GUIDE_USER` message to a specific user's WebSocket connection

---

## 14. PowerShell Automation Scripts

All scripts run from the **Automation Center** UI via `POST /api/system/scripts/:id/run`.

| Script | What it does |
|---|---|
| `db-backup.ps1` | Exports all MongoDB collections to a timestamped ZIP |
| `db-restore.ps1` | Restores from latest or specific backup ZIP |
| `xml-backup.ps1` | ZIPs all generated XML files |
| `xml-transform.ps1` | Runs XSLT transformation on XML files |
| `health-check.ps1` | Checks Node.js, MongoDB, disk, memory status |
| `log-cleanup.ps1` | Deletes log files older than 30 days |
| `queue-consumer.ps1` | Starts a Kafka consumer process |
| `report-gen.ps1` | Generates analytics reports |
| `notify-process.ps1` | Processes and dispatches pending notifications |

---

## 15. Docker & Containerization

**File:** `docker-compose.yml`

Three services in one network (`ravensync-net`):

| Container | Image | Port | Data Volume |
|---|---|---|---|
| `ravensync-mongo` | `mongo:7.0` | 27017 | `mongo_data` |
| `ravensync-kafka` | `apache/kafka:3.7.0` | 9092 | `kafka_data` |
| `ravensync-kafka-ui` | `provectuslabs/kafka-ui` | 8080 | — |
| `ravensync-rabbitmq` | `rabbitmq:3.13-management` | 5672, 15672 | `rabbitmq_data` |

- Kafka runs in **KRaft mode** (no ZooKeeper needed) — `KAFKA_PROCESS_ROLES: broker,controller`
- `kafka-ui` depends on Kafka being healthy before starting (`condition: service_healthy`)
- RabbitMQ management UI at `http://localhost:15672` (login: `guest` / `guest`) — shows queues, message rates, consumers
- `docker compose down -v` wipes all volumes for a clean slate

---

## 16. PWA (Progressive Web App)

**Files:** `frontend/public/sw.js`, `frontend/public/manifest.json`

- **Service Worker** caches static assets — app loads offline
- **Web Manifest** enables "Add to Home Screen" on mobile/desktop
- **Install prompt** is intercepted with `beforeinstallprompt` event and shown as a custom banner
- Relevant for emergency use — users can access the app even with poor connectivity

---

## 17. Cron Jobs (Scheduled Tasks)

**File:** `backend/server.js` (using `node-cron`)

| Schedule | Task |
|---|---|
| Every 6 hours | XML backup check |
| Daily at 2:00 AM | Log cleanup |

---

## 18. Production Deployment

| Service | Role |
|---|---|
| Render | Hosts the Node.js backend + serves static frontend |
| MongoDB Atlas | Cloud database (M0 free tier, 512MB) |
| RedPanda Cloud | Kafka-compatible broker (serverless, 10GB/month free) |

### Key environment variables:
- `MONGODB_URI` — Atlas connection string
- `JWT_SECRET` — random secret for signing tokens
- `KAFKA_BROKERS` — RedPanda broker address
- `KAFKA_SASL_USERNAME` / `KAFKA_SASL_PASSWORD` — triggers SSL + SASL auth automatically
- `FRONTEND_URL` — used for CORS origin and QR code generation

---

## 19. Likely Instructor Questions & Answers

**Q: Why use WebSocket instead of just REST polling?**
A: REST polling wastes bandwidth and adds latency — the client repeatedly asks "anything new?" even when nothing changed. WebSocket keeps one persistent TCP connection open; the server pushes data only when an event occurs. For emergencies, that latency difference can matter.

**Q: What is the difference between DOM and SAX parsing?**
A: DOM loads the entire XML document into memory as a tree — easy to navigate but memory-heavy. SAX is event-driven and processes the document sequentially, firing events for each tag — memory-efficient for large files but you can't go back to a previous element.

**Q: Why does the password field have `select: false` in the schema?**
A: It prevents the password hash from being included in any query result by default. You must explicitly add `.select('+password')` when you actually need it (like during login). This prevents accidental password exposure in API responses.

**Q: Why did you use MongoDB if it is not part of the required topics?**
A: MongoDB is background infrastructure for authentication — JWT login requires a place to store users. Without login, there is no one to send alerts to or trigger XML exports. It is not a feature we are defending.

**Q: Why not just use XML as the database instead of MongoDB?**
A: RavenSync is a real-time platform with 50+ users connecting simultaneously during emergencies. Concurrent writes to the same XML file cause file corruption — two users logging in at the same time would overwrite each other's data. MongoDB handles concurrent access safely with atomic operations. XML files also have no indexing, so querying 1000 alerts by severity requires reading the entire file every time. File corruption during an actual emergency is unacceptable. NutriNest can use XML as a database because it is a single-user personal finance tracker with minimal concurrent access — a completely different use case.

**Q: So XML is not used for data storage at all?**
A: XML is used as the data exchange and reporting format — all alerts, users, audit logs, and reports are exported, parsed (DOM + SAX), and transformed (XSLT) as XML. MongoDB is just the write-safe storage layer behind it.

**Q: What is RabbitMQ used for and how is it different from Kafka?**
A: RabbitMQ handles point-to-point task dispatch — audit log writes (async, non-blocking), announcement notifications, and guide-user delivery. Kafka is a log/stream where many consumers read the same message simultaneously (fan-out). RabbitMQ is a post office — one message, one worker, then deleted. Kafka is a logbook — messages persist and are replayable. They solve different problems so we use both intentionally.

**Q: What happens if RabbitMQ goes down?**
A: The `rabbitMQService` catches the error and falls back gracefully — audit logs write synchronously to MongoDB directly, and guide-user messages fall back to direct WebSocket delivery. `_scheduleReconnect()` retries every 10 seconds.

**Q: How does the profanity filter handle leet-speak like "f4ck"?**
A: Each word is converted to a regex that substitutes common character replacements — `a` becomes `[a@4]`, `i` becomes `[i1!]`, etc. So "f4ck" still matches the pattern for "fuck".

**Q: What is RBAC and how is it implemented here?**
A: Role-Based Access Control restricts what actions a user can perform based on their role. In RavenSync, the `authorize(...roles)` middleware checks `req.user.role` against an allowed list. For example, `authorize('superadmin')` on the delete-user route means only superadmins can reach that controller.

**Q: Why is bcrypt used with 12 rounds specifically?**
A: bcrypt's cost factor (rounds) controls how slow the hashing is. 12 rounds is the current industry recommendation — slow enough that brute-forcing a stolen hash database is impractical, but fast enough that legitimate logins don't feel sluggish (typically ~250ms).

**Q: What is the SPA router doing with `history.pushState`?**
A: It changes the URL in the browser's address bar without triggering a full page reload. The `render()` function then calls the matching page component to update the DOM. The `popstate` event listener handles the browser's back/forward buttons.

**Q: How does audit logging work without modifying every controller?**
A: The `auditLogger` middleware wraps `res.json()` — it intercepts the response after the controller finishes. This means audit records are written automatically for any route the middleware is applied to, without touching the controller code.

**Q: Why does the seed script use `new mongoose.Types.ObjectId()` for `_id`?**
A: Mongoose expects `_id` to be a proper `ObjectId` type. If you insert a plain string, Mongoose's `save()` and `findById()` won't work correctly because they compare ObjectId types. The seed script ensures correct types from the start.

**Q: What is KRaft mode in Kafka?**
A: KRaft (Kafka Raft) is Kafka's built-in consensus protocol that replaces the older ZooKeeper dependency. In the docker-compose, `KAFKA_PROCESS_ROLES: broker,controller` means the single Kafka container acts as both the message broker and the cluster controller — simpler setup for local development.

**Q: How does the channel locking feature work during emergencies?**
A: The `Channel` schema has a `lockedDuringEmergency` boolean. In `sendMessage`, if the channel is locked and the user is not an admin, the controller checks for any active alert in the database. If one exists, the message is rejected with a 403 error.

---

## 20. Quick Reference — Key Numbers

| Fact | Value |
|---|---|
| JWT expiry | 7 days |
| bcrypt rounds | 12 |
| Rate limit (general) | 100 req / 15 min |
| Rate limit (auth) | 500 req / 15 min |
| Message rate limit (chat) | 5 seconds between messages |
| Profanity warnings before mute | 3 |
| Mute durations | 5 min → 10 min → 15 min |
| WebSocket heartbeat interval | 30 seconds |
| Kafka reconnect delay | 10 seconds |
| Max message length | 500 characters |
| Avatar upload limit | 2 MB |
| Request body limit | 10 MB |
| Default port | 5000 |
| Kafka UI port | 8080 |
| MongoDB port | 27017 |
