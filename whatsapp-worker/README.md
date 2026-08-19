# whatsapp-worker

Standalone Node.js service that maintains the persistent WhatsApp/Baileys connection for JustOneTrade.

The Vercel application proxies all WhatsApp operations to this worker via authenticated HTTP.

```
Admin UI → Vercel API routes → whatsapp-worker → Baileys → WhatsApp
```

---

## Environment variables

### Worker (Render / local)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Same Postgres connection string as the Vercel app |
| `WHATSAPP_WORKER_SECRET` | ✅ | Shared secret — must match the Vercel side |
| `PORT` | ✅ | Port to listen on (Render sets this automatically) |
| `NODE_ENV` | — | `production` on Render, `development` locally |
| `LOG_LEVEL` | — | `info` (default). Options: `trace`, `debug`, `warn`, `error` |

### Vercel app (add to Vercel dashboard)

| Variable | Required | Description |
|---|---|---|
| `WHATSAPP_WORKER_URL` | ✅ | Public URL of this worker, e.g. `https://whatsapp-worker.onrender.com` |
| `WHATSAPP_WORKER_SECRET` | ✅ | Same secret as above |

Generate a strong secret:
```bash
openssl rand -hex 32
```

---

## Running locally

```bash
# 1. Install dependencies
cd whatsapp-worker
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env — set DATABASE_URL and WHATSAPP_WORKER_SECRET

# 3. Build and start the worker
npm run dev

# To watch for changes during development (two terminals):
#   Terminal 1: npm run dev:watch   (recompiles on save)
#   Terminal 2: node dist/index.js  (restart after changes)
```

The worker starts on http://localhost:3001 by default.

To use the local worker with the Vercel dev server, set in your **main app** `.env`:
```
WHATSAPP_WORKER_URL=http://localhost:3001
WHATSAPP_WORKER_SECRET=<same secret as worker .env>
```

---

## API endpoints

All endpoints except `/health` require:
```
Authorization: Bearer <WHATSAPP_WORKER_SECRET>
```

### GET /health (public)
```json
{ "status": "ok", "whatsapp": "connected" }
```
`whatsapp` values: `disconnected` | `connecting` | `qr_ready` | `connected`

### POST /connect
Trigger Baileys initialization. Returns QR if not yet authenticated.
```json
// Request (optional)
{ "forceNew": true }

// Response — QR ready
{ "success": true, "status": "qr_ready", "qrCode": "data:image/png;base64,..." }

// Response — already connected
{ "success": true, "status": "connected", "groups": [...], "connectedNumber": "919876543210" }
```

### GET /status
```json
{ "success": true, "status": "connected", "groups": [...], "connectedNumber": "919876543210" }
```

### POST /send-message
```json
// Request
{ "groupId": "120363XXXXXXXXXX@g.us", "message": "Buy spx 5800 call" }

// Response
{ "success": true, "messageId": "ABCD1234" }
```

### POST /disconnect
Logs out and wipes credentials from the database.
```json
{ "success": true }
```

### GET /groups
```json
{ "success": true, "groups": [{ "id": "...", "name": "Signals Group", "participantsCount": 42 }] }
```

---

## Initial WhatsApp authentication (first login)

On first deployment (no saved credentials):

1. Deploy the worker to Render (see below)
2. Go to the admin dashboard on your Vercel app
3. Click **Connect WhatsApp Bot**
4. A QR code will appear — scan it with WhatsApp on your phone:
   - Open WhatsApp → Settings → Linked Devices → Link a Device
5. Once scanned, status changes to **connected**
6. Credentials are saved to the `WhatsAppAuth` table in Postgres
7. On future restarts, the session restores automatically — **no re-scan needed**

---

## What happens on worker restart

The worker:
1. Starts the HTTP server immediately
2. Loads Baileys credentials from the `WhatsAppAuth` Postgres table
3. Reconnects to WhatsApp silently (no QR needed if session is still valid)
4. Logs `WhatsApp connected` within a few seconds

If the session was invalidated (WhatsApp logged out the device):
- Worker will be `disconnected`
- Admin must click **Connect WhatsApp Bot** again and scan a new QR

---

## Deploying to Render

### Step 1 — Create a new Web Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Set the **Root Directory** to `whatsapp-worker`
4. Configure:

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Starter ($7/mo) — needs to stay alive persistently |

> ⚠️ **Do NOT use the Free tier** — free Render instances spin down after inactivity, which will kill the WhatsApp connection.

### Step 2 — Set environment variables on Render

In the Render dashboard → your service → **Environment**:

```
DATABASE_URL        = <your Neon/Postgres connection string>
WHATSAPP_WORKER_SECRET = <your generated secret>
NODE_ENV            = production
LOG_LEVEL           = info
```

`PORT` is set automatically by Render.

### Step 3 — Set environment variables on Vercel

In the Vercel dashboard → your project → **Settings** → **Environment Variables**:

```
WHATSAPP_WORKER_URL    = https://your-service-name.onrender.com
WHATSAPP_WORKER_SECRET = <same secret as Render>
```

### Step 4 — Deploy and authenticate

1. Push to main → both Vercel and Render will deploy automatically
2. Go to your admin dashboard → **Connect WhatsApp Bot**
3. Scan the QR code
4. Done ✅

---

## Testing the complete flow

### Test 1: Health check
```bash
curl https://your-worker.onrender.com/health
# → { "status": "ok", "whatsapp": "connected" }
```

### Test 2: Unauthenticated request (should be rejected)
```bash
curl -X POST https://your-worker.onrender.com/send-message \
  -H "Content-Type: application/json" \
  -d '{"groupId":"...","message":"test"}'
# → HTTP 401 { "error": "Unauthorized" }
```

### Test 3: Send a message via the API
```bash
curl -X POST https://your-worker.onrender.com/send-message \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"groupId":"120363XXXXXXXXXX@g.us","message":"Test signal"}'
# → { "success": true, "messageId": "..." }
```

### Test 4: End-to-end through admin UI
Click any signal button in the admin dashboard → message appears in the WhatsApp group.

### Test 5: Restart resilience
Restart the worker on Render → wait ~10 seconds → check `/health` → should show `connected` without re-scanning.
