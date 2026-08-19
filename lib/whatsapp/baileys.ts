import makeWASocket, {
  useMultiFileAuthState as getMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type GroupMetadata,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";

export type WhatsAppStatus = "disconnected" | "connecting" | "qr_ready" | "connected";

export interface WhatsAppGroupInfo {
  id: string;
  name: string;
  participantsCount?: number;
}

class WhatsAppService {
  private sock: WASocket | null = null;
  private status: WhatsAppStatus = "disconnected";
  private qrCodeDataUrl: string | null = null;
  private rawQr: string | null = null;
  private groupsCache: WhatsAppGroupInfo[] = [];
  private authDir: string;
  private isInitializing: boolean = false;
  private logger = pino({ level: "silent" });

  constructor() {
    // In serverless production (Vercel) the only writable dir is /tmp.
    // In local dev use project root so creds persist across restarts.
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    this.authDir = isProd
      ? "/tmp/auth_info_baileys"
      : path.join(process.cwd(), "auth_info_baileys");
  }

  // ---------------------------------------------------------------------------
  // DB state persistence — keeps QR/status visible across Vercel cold starts
  // ---------------------------------------------------------------------------

  private async persistState(): Promise<void> {
    try {
      await prisma.whatsAppState.upsert({
        where: { key: "singleton" },
        update: {
          status: this.status,
          qrCodeDataUrl: this.qrCodeDataUrl,
          connectedNumber: this.sock?.user?.id
            ? this.sock.user.id.split(":")[0].replace(/[^0-9]/g, "")
            : null,
          groupsJson: JSON.stringify(this.groupsCache),
        },
        create: {
          key: "singleton",
          status: this.status,
          qrCodeDataUrl: this.qrCodeDataUrl,
          connectedNumber: null,
          groupsJson: "[]",
        },
      });
    } catch (err) {
      // Non-fatal — best-effort persistence
      console.error("WhatsApp: failed to persist state to DB:", err);
    }
  }

  private async loadStateFromDb(): Promise<{
    status: WhatsAppStatus;
    qrCode: string | null;
    connectedNumber?: string;
    groups: WhatsAppGroupInfo[];
  } | null> {
    try {
      const row = await prisma.whatsAppState.findUnique({ where: { key: "singleton" } });
      if (!row) return null;
      const groups: WhatsAppGroupInfo[] = row.groupsJson ? JSON.parse(row.groupsJson) : [];
      return {
        status: row.status as WhatsAppStatus,
        qrCode: row.qrCodeDataUrl ?? null,
        connectedNumber: row.connectedNumber ?? undefined,
        groups,
      };
    } catch (err) {
      console.error("WhatsApp: failed to load state from DB:", err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public async getStatus(): Promise<{
    status: WhatsAppStatus;
    qrCode: string | null;
    rawQr: string | null;
    groups: WhatsAppGroupInfo[];
    connectedNumber?: string;
  }> {
    // If this in-memory instance knows it's connected / has a QR, trust it.
    if (this.status === "connected" || this.status === "qr_ready") {
      const userJid = this.sock?.user?.id;
      const connectedNumber = userJid ? userJid.split(":")[0].replace(/[^0-9]/g, "") : undefined;
      return {
        status: this.status,
        qrCode: this.qrCodeDataUrl,
        rawQr: this.rawQr,
        groups: this.groupsCache,
        connectedNumber,
      };
    }

    // This instance is disconnected (e.g. a cold serverless start).
    // Fall back to the DB state so the UI doesn't flicker.
    const dbState = await this.loadStateFromDb();
    if (dbState && (dbState.status === "qr_ready" || dbState.status === "connected")) {
      return {
        status: dbState.status,
        qrCode: dbState.qrCode,
        rawQr: null,
        groups: dbState.groups,
        connectedNumber: dbState.connectedNumber,
      };
    }

    // Truly disconnected
    return {
      status: this.status,
      qrCode: this.qrCodeDataUrl,
      rawQr: this.rawQr,
      groups: this.groupsCache,
      connectedNumber: undefined,
    };
  }

  public async initialize(forceNew: boolean = false): Promise<{
    status: WhatsAppStatus;
    qrCode: string | null;
  }> {
    if (this.sock && this.status === "connected" && !forceNew) {
      return { status: "connected", qrCode: null };
    }

    if (forceNew) {
      await this.disconnect();
    }

    if (this.isInitializing) {
      return this.waitForQrOrConnected(4000);
    }

    this.isInitializing = true;
    this.status = "connecting";
    this.qrCodeDataUrl = null;
    this.rawQr = null;

    // Persist "connecting" state so UI shows spinner immediately
    await this.persistState();

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await getMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: this.logger,
        printQRInTerminal: false,
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.rawQr = qr;
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          } catch (qrErr) {
            console.error("Failed to generate QR code data URL:", qrErr);
          }
          this.status = "qr_ready";
          // Persist QR to DB so other cold instances can serve it
          await this.persistState();
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCodeDataUrl = null;
          this.rawQr = null;
          console.log("WhatsApp Baileys connected successfully!");
          await this.refreshGroups();
          // Persist connected state (clears the QR from DB)
          await this.persistState();
        } else if (connection === "close") {
          const boomError = lastDisconnect?.error as { output?: { statusCode?: number } } | undefined;
          const statusCode = boomError?.output?.statusCode;
          const isLoggedOut =
            statusCode === DisconnectReason.loggedOut ||
            statusCode === DisconnectReason.badSession ||
            statusCode === 401 ||
            statusCode === 403;

          console.log(`WhatsApp connection closed. Status code: ${statusCode}, isLoggedOut: ${isLoggedOut}`);

          this.status = "disconnected";
          this.sock = null;
          this.isInitializing = false;

          if (isLoggedOut) {
            this.qrCodeDataUrl = null;
            this.rawQr = null;
            try {
              if (fs.existsSync(this.authDir)) {
                fs.rmSync(this.authDir, { recursive: true, force: true });
              }
            } catch (err) {
              console.error("Error clearing auth directory:", err);
            }
            // Clear DB state too so UI shows "disconnected" correctly
            await this.persistState();
          }
        }
      });

      this.isInitializing = false;
      return await this.waitForQrOrConnected(5000);
    } catch (error) {
      console.error("Error initializing WhatsApp Baileys socket:", error);
      this.status = "disconnected";
      this.sock = null;
      this.isInitializing = false;
      await this.persistState();
      return { status: "disconnected", qrCode: null };
    }
  }

  private async waitForQrOrConnected(maxWaitMs: number = 4000): Promise<{
    status: WhatsAppStatus;
    qrCode: string | null;
  }> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      if (this.status === "connected" || (this.status === "qr_ready" && this.qrCodeDataUrl)) {
        return { status: this.status, qrCode: this.qrCodeDataUrl };
      }
      await new Promise((res) => setTimeout(res, 200));
    }
    return { status: this.status, qrCode: this.qrCodeDataUrl };
  }

  public async refreshGroups(): Promise<WhatsAppGroupInfo[]> {
    if (!this.sock || this.status !== "connected") {
      return [];
    }

    try {
      const groupsData: { [key: string]: GroupMetadata } = await this.sock.groupFetchAllParticipating();
      const groupsList: WhatsAppGroupInfo[] = Object.values(groupsData).map((g) => ({
        id: g.id,
        name: g.subject || "Unnamed Group",
        participantsCount: g.participants?.length || 0,
      }));

      this.groupsCache = groupsList;
      return groupsList;
    } catch (error) {
      console.error("Failed to fetch WhatsApp participating groups:", error);
      return this.groupsCache;
    }
  }

  public async sendMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.sock || this.status !== "connected") {
      return { success: false, error: "WhatsApp is not connected. Please scan the QR code first." };
    }

    try {
      let recipientJid = to.trim();
      if (!recipientJid.includes("@")) {
        recipientJid = `${recipientJid}@g.us`;
      }

      const result = await this.sock.sendMessage(recipientJid, { text: message });
      return { success: true, messageId: result?.key?.id || undefined };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to dispatch message via WhatsApp.";
      console.error(`Failed to send WhatsApp message to ${to}:`, error);
      return { success: false, error: errMsg };
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
    } catch (error) {
      console.warn("Error during WhatsApp logout (safe to ignore):", error);
    } finally {
      this.status = "disconnected";
      this.sock = null;
      this.qrCodeDataUrl = null;
      this.rawQr = null;
      this.groupsCache = [];
      this.isInitializing = false;
      // Clear persisted state so all instances see "disconnected"
      await this.persistState();
      try {
        if (fs.existsSync(this.authDir)) {
          fs.rmSync(this.authDir, { recursive: true, force: true });
        }
      } catch (rmErr) {
        console.error("Error clearing auth directory:", rmErr);
      }
    }
  }
}

// Global singleton instance across Next.js dev server reloads
const globalForWhatsApp = globalThis as unknown as {
  whatsAppServiceInstance?: WhatsAppService;
};

export const whatsAppService = globalForWhatsApp.whatsAppServiceInstance ?? new WhatsAppService();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsApp.whatsAppServiceInstance = whatsAppService;
}
