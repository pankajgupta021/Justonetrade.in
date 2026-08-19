/**
 * WhatsAppService — persistent Baileys connection for the worker process.
 *
 * Lifecycle:
 *   process start → auto-connect (if creds exist in DB) → keep socket alive
 *   → receive /send-message requests → send via existing socket
 */

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type GroupMetadata,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import { useDbAuthState, clearDbAuthState } from "./db-auth-state";
import { statePersist } from "./db";
import { logger } from "./logger";

export type WhatsAppStatus = "disconnected" | "connecting" | "qr_ready" | "connected";

export interface GroupInfo {
  id: string;
  name: string;
  participantsCount?: number;
}

const MAX_AUTO_RECONNECTS = 10;
const RECONNECT_BASE_MS = 2000;

export class WhatsAppService {
  private sock: WASocket | null = null;
  private status: WhatsAppStatus = "disconnected";
  private qrCodeDataUrl: string | null = null;
  private groupsCache: GroupInfo[] = [];
  private isInitializing = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectedNumber: string | undefined = undefined;

  private readonly baileysLogger = pino({ level: "silent" });

  // ── Public state ───────────────────────────────────────────────────────────

  getStatus(): WhatsAppStatus {
    return this.status;
  }

  getQrCode(): string | null {
    return this.qrCodeDataUrl;
  }

  getGroups(): GroupInfo[] {
    return this.groupsCache;
  }

  getConnectedNumber(): string | undefined {
    return this.connectedNumber;
  }

  // ── Socket cleanup ─────────────────────────────────────────────────────────

  private closeExistingSocket(): void {
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners("connection.update");
        this.sock.ev.removeAllListeners("creds.update");
        this.sock.end(undefined);
      } catch {
        // ignore error during cleanup
      }
      this.sock = null;
    }
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  async initialize(forceNew = false): Promise<{ status: WhatsAppStatus; qrCode: string | null }> {
    if (this.sock && this.status === "connected" && !forceNew) {
      return { status: "connected", qrCode: null };
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (forceNew) {
      await this.doDisconnect(true);
    }

    if (this.isInitializing) {
      return this.waitForQrOrConnected(8000);
    }

    this.isInitializing = true;
    this.status = "connecting";
    this.qrCodeDataUrl = null;
    await this.persistState();

    // Close any previous dangling socket before creating a new one
    this.closeExistingSocket();

    try {
      const { state, saveCreds } = await useDbAuthState();
      const { version } = await fetchLatestBaileysVersion();

      logger.info({ version }, "Initializing Baileys socket");

      const sock = makeWASocket({
        version,
        auth: state,
        logger: this.baileysLogger,
        printQRInTerminal: false,
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        defaultQueryTimeoutMs: 60000,
      });

      this.sock = sock;

      sock.ev.on("creds.update", async () => {
        await saveCreds();
        const me = sock.user?.id || state.creds?.me?.id;
        if (me) {
          this.connectedNumber = me.split(":")[0].replace(/[^0-9]/g, "");
        }
      });

      sock.ev.on("connection.update", (update) => this.handleConnectionUpdate(update));

      this.isInitializing = false;
      return await this.waitForQrOrConnected(8000);
    } catch (err) {
      logger.error({ err }, "Failed to initialize Baileys socket");
      this.status = "disconnected";
      this.closeExistingSocket();
      this.isInitializing = false;
      await this.persistState();
      return { status: "disconnected", qrCode: null };
    }
  }

  // ── Connection event handler ───────────────────────────────────────────────

  private async handleConnectionUpdate(update: {
    connection?: string;
    lastDisconnect?: { error?: unknown };
    qr?: string;
  }): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        this.qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
      } catch (err) {
        logger.error({ err }, "Failed to generate QR data URL");
      }
      this.status = "qr_ready";
      logger.info("QR code ready — waiting for scan");
      await this.persistState();
    }

    if (connection === "open") {
      this.status = "connected";
      this.qrCodeDataUrl = null;
      this.reconnectAttempts = 0;

      const userJid = this.sock?.user?.id;
      if (userJid) {
        this.connectedNumber = userJid.split(":")[0].replace(/[^0-9]/g, "");
      }

      logger.info({ number: this.connectedNumber }, "WhatsApp connected successfully");
      await this.persistState();

      // Non-blocking groups refresh
      setTimeout(() => {
        this.refreshGroups().catch(() => {});
      }, 1000);
    }

    if (connection === "close") {
      const err = lastDisconnect?.error as { output?: { statusCode?: number } } | undefined;
      const code = err?.output?.statusCode;
      const isLoggedOut =
        code === DisconnectReason.loggedOut ||
        code === DisconnectReason.badSession ||
        code === 401 ||
        code === 403;

      logger.warn({ code, isLoggedOut }, "WhatsApp connection closed");

      this.closeExistingSocket();
      this.isInitializing = false;

      if (isLoggedOut) {
        logger.info("Session invalidated — clearing credentials from DB");
        this.status = "disconnected";
        this.qrCodeDataUrl = null;
        this.connectedNumber = undefined;
        this.groupsCache = [];
        await clearDbAuthState();
        await this.persistState();
        return;
      }

      // Code 515 (restartRequired) is standard after QR pairing — reconnect immediately!
      if (code === DisconnectReason.restartRequired || code === 515) {
        logger.info("Restart required after pairing — reconnecting immediately");
        this.status = "connecting";
        await this.persistState();
        setTimeout(() => {
          this.initialize(false).catch((e) => logger.error({ err: e }, "Pairing reconnect failed"));
        }, 500);
        return;
      }

      // Connection replaced (code 440) — do not spam reconnect
      if (code === DisconnectReason.connectionReplaced || code === 440) {
        logger.warn("Connection replaced by another session — pausing reconnect");
        this.status = "disconnected";
        await this.persistState();
        return;
      }

      // Temporary disconnect — schedule automatic reconnect
      this.status = "disconnected";
      await this.persistState();
      this.scheduleReconnect();
    }
  }

  // ── Auto-reconnect ─────────────────────────────────────────────────────────

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_AUTO_RECONNECTS) {
      logger.error(
        { attempts: this.reconnectAttempts },
        "Max reconnect attempts reached — manual reconnect required"
      );
      return;
    }

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(1.5, this.reconnectAttempts),
      30_000
    );
    this.reconnectAttempts += 1;

    logger.info({ attempt: this.reconnectAttempts, delayMs: delay }, "Scheduling reconnect");

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(async () => {
      logger.info({ attempt: this.reconnectAttempts }, "Auto-reconnecting");
      await this.initialize(false);
    }, delay);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async waitForQrOrConnected(maxMs: number): Promise<{ status: WhatsAppStatus; qrCode: string | null }> {
    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline) {
      if (this.status === "connected" || (this.status === "qr_ready" && this.qrCodeDataUrl)) {
        return { status: this.status, qrCode: this.qrCodeDataUrl };
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return { status: this.status, qrCode: this.qrCodeDataUrl };
  }

  private async persistState(): Promise<void> {
    try {
      await statePersist({
        status: this.status,
        qrCodeDataUrl: this.qrCodeDataUrl,
        connectedNumber: this.connectedNumber ?? null,
        groupsJson: JSON.stringify(this.groupsCache),
      });
    } catch (err) {
      logger.error({ err }, "Failed to persist WhatsApp state to DB");
    }
  }

  // ── Groups ─────────────────────────────────────────────────────────────────

  async refreshGroups(): Promise<GroupInfo[]> {
    if (!this.sock || this.status !== "connected") return this.groupsCache;

    try {
      const data: Record<string, GroupMetadata> = await this.sock.groupFetchAllParticipating();
      this.groupsCache = Object.values(data).map((g) => ({
        id: g.id,
        name: g.subject ?? "Unnamed Group",
        participantsCount: g.participants?.length ?? 0,
      }));
      await this.persistState();
      return this.groupsCache;
    } catch (err) {
      logger.error({ err }, "Failed to fetch WhatsApp groups");
      return this.groupsCache;
    }
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  async sendMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.sock || this.status !== "connected") {
      return { success: false, error: "WhatsApp is not connected" };
    }

    try {
      let jid = to.trim();
      if (!jid.includes("@")) {
        jid = `${jid}@g.us`;
      }
      const result = await this.sock.sendMessage(jid, { text: message });
      logger.info({ to: jid, messageId: result?.key?.id }, "Message sent");
      return { success: true, messageId: result?.key?.id ?? undefined };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      logger.error({ err, to }, "Failed to send WhatsApp message");
      return { success: false, error: msg };
    }
  }

  // ── Disconnect ─────────────────────────────────────────────────────────────

  async disconnect(): Promise<void> {
    await this.doDisconnect(true);
  }

  private async doDisconnect(clearCreds: boolean): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      if (this.sock) {
        await this.sock.logout();
      }
    } catch {
      // Ignore logout errors
    } finally {
      this.closeExistingSocket();
      this.status = "disconnected";
      this.qrCodeDataUrl = null;
      this.connectedNumber = undefined;
      this.groupsCache = [];
      this.isInitializing = false;
      this.reconnectAttempts = 0;

      if (clearCreds) {
        await clearDbAuthState();
      }
      await this.persistState();
    }
  }

  // ── Graceful shutdown ──────────────────────────────────────────────────────

  async shutdown(): Promise<void> {
    logger.info("Graceful shutdown: closing WhatsApp socket");
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.closeExistingSocket();
    this.status = "disconnected";
  }
}

export const whatsapp = new WhatsAppService();
