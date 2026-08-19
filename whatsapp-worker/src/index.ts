/**
 * whatsapp-worker — HTTP server entry point
 *
 * Routes (all except /health require Bearer WHATSAPP_WORKER_SECRET):
 *   GET  /health
 *   POST /connect          { forceNew?: boolean }
 *   GET  /status
 *   POST /send-message     { groupId: string, message: string }
 *   POST /disconnect
 *   GET  /groups
 */

import "dotenv/config"; // load .env in development
import express from "express";
import { whatsapp } from "./whatsapp";
import { requireSecret } from "./auth";
import { logger } from "./logger";
import { hasSavedSession } from "./db-auth-state";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── Health (public) ──────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", whatsapp: whatsapp.getStatus() });
});

// ── All routes below require the shared secret ───────────────────────────────

app.use(requireSecret);

// POST /connect
// Triggers Baileys initialization. Waits up to 8s for a QR or connected status.
app.post("/connect", async (req, res) => {
  try {
    const forceNew = req.body?.forceNew === true;
    const result = await whatsapp.initialize(forceNew);
    res.json({
      success: true,
      status: result.status,
      qrCode: result.qrCode,
      groups: whatsapp.getGroups(),
      connectedNumber: whatsapp.getConnectedNumber(),
    });
  } catch (err) {
    logger.error({ err }, "POST /connect error");
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

// GET /status
app.get("/status", (_req, res) => {
  res.json({
    success: true,
    status: whatsapp.getStatus(),
    qrCode: whatsapp.getQrCode(),
    groups: whatsapp.getGroups(),
    connectedNumber: whatsapp.getConnectedNumber(),
  });
});

// POST /send-message
app.post("/send-message", async (req, res) => {
  const { groupId, message } = req.body ?? {};

  if (!groupId || typeof groupId !== "string") {
    res.status(400).json({ success: false, error: "groupId is required" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }
  if (message.length > 4096) {
    res.status(400).json({ success: false, error: "message too long (max 4096 chars)" });
    return;
  }

  try {
    const result = await whatsapp.sendMessage(groupId, message.trim());
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, messageId: result.messageId });
  } catch (err) {
    logger.error({ err }, "POST /send-message error");
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

// POST /disconnect
app.post("/disconnect", async (_req, res) => {
  try {
    await whatsapp.disconnect();
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "POST /disconnect error");
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

// GET /groups
app.get("/groups", async (_req, res) => {
  try {
    const groups = await whatsapp.refreshGroups();
    res.json({ success: true, groups });
  } catch (err) {
    logger.error({ err }, "GET /groups error");
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, "0.0.0.0", async () => {
  logger.info({ port: PORT }, "whatsapp-worker listening");

  try {
    const hasSession = await hasSavedSession();
    if (hasSession) {
      logger.info("Found saved WhatsApp session — auto-reconnecting");
      const result = await whatsapp.initialize(false);
      logger.info({ status: result.status }, "Startup connect complete");
    } else {
      logger.info("No saved WhatsApp session. Waiting for admin to connect via dashboard.");
    }
  } catch (err) {
    logger.error({ err }, "Startup session check failed");
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutdown signal received");
  server.close(async () => {
    await whatsapp.shutdown();
    logger.info("Worker shut down cleanly");
    process.exit(0);
  });

  // Force exit after 10s if server doesn't close cleanly
  setTimeout(() => {
    logger.warn("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — worker will exit");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
  // Don't exit — log and continue
});
