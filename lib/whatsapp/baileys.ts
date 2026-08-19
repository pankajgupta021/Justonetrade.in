import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type GroupMetadata,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { useDbAuthState, clearDbAuthState } from "./db-auth-state";

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
  private isInitializing: boolean = false;
  private logger = pino({ level: "silent" });

  // ---------------------------------------------------------------------------
  // Postgres state persistence — survives Vercel cold starts across all instances
  // ---------------------------------------------------------------------------

  private async persistState(): Promise<void> {
    try {
      const userJid = this.sock?.user?.id;
      const connectedNumber = userJid
        ? userJid.split(":")[0].replace(/[^0-9]/g, "")
        : null;

      await prisma.whatsAppState.upsert({
        where: { key: "singleton" },
        update: {
          status: this.status,
          qrCodeDataUrl: this.qrCodeDataUrl,
          connectedNumber,
          groupsJson: JSON.stringify(this.groupsCache),
        },
        create: {
          key: "singleton",
          status: this.status,
          qrCodeDataUrl: this.qrCodeDataUrl,
          connectedNumber,
          groupsJson: "[]",
        },
      });
    } catch (err) {
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
      const groups: WhatsAppGroupInfo[] = row.groupsJson
        ? JSON.parse(row.groupsJson)
        : [];
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
    // If this instance holds an active connection, serve from memory (fastest)
    if (this.status === "connected" || this.status === "qr_ready") {
      const userJid = this.sock?.user?.id;
      const connectedNumber = userJid
        ? userJid.split(":")[0].replace(/[^0-9]/g, "")
        : undefined;
      return {
        status: this.status,
        qrCode: this.qrCodeDataUrl,
        rawQr: this.rawQr,
        groups: this.groupsCache,
        connectedNumber,
      };
    }

    // Cold instance — read shared truth from DB
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

    return {
      status: this.status,
      qrCode: null,
      rawQr: null,
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
    await this.persistState();

    try {
      // Load credentials from Postgres — works on every Vercel instance
      const { state, saveCreds } = await useDbAuthState();
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

      // Persist credentials on every update
      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.rawQr = qr;
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          } catch (qrErr) {
            console.error("Failed to generate QR data URL:", qrErr);
          }
          this.status = "qr_ready";
          await this.persistState();
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCodeDataUrl = null;
          this.rawQr = null;
          console.log("WhatsApp connected successfully!");
          await this.refreshGroups();
          await this.persistState();
        } else if (connection === "close") {
          const boomError = lastDisconnect?.error as
            | { output?: { statusCode?: number } }
            | undefined;
          const statusCode = boomError?.output?.statusCode;
          const isLoggedOut =
            statusCode === DisconnectReason.loggedOut ||
            statusCode === DisconnectReason.badSession ||
            statusCode === 401 ||
            statusCode === 403;

          console.log(
            `WhatsApp connection closed. Code: ${statusCode}, loggedOut: ${isLoggedOut}`
          );

          this.status = "disconnected";
          this.sock = null;
          this.isInitializing = false;

          if (isLoggedOut) {
            // Wipe credentials from DB so the next scan starts clean
            this.qrCodeDataUrl = null;
            this.rawQr = null;
            await clearDbAuthState();
          }

          await this.persistState();
        }
      });

      this.isInitializing = false;
      return await this.waitForQrOrConnected(5000);
    } catch (error) {
      console.error("Error initializing WhatsApp socket:", error);
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
      if (
        this.status === "connected" ||
        (this.status === "qr_ready" && this.qrCodeDataUrl)
      ) {
        return { status: this.status, qrCode: this.qrCodeDataUrl };
      }
      await new Promise((res) => setTimeout(res, 200));
    }
    return { status: this.status, qrCode: this.qrCodeDataUrl };
  }

  public async refreshGroups(): Promise<WhatsAppGroupInfo[]> {
    if (!this.sock || this.status !== "connected") return [];

    try {
      const groupsData: { [key: string]: GroupMetadata } =
        await this.sock.groupFetchAllParticipating();
      const groupsList: WhatsAppGroupInfo[] = Object.values(groupsData).map((g) => ({
        id: g.id,
        name: g.subject || "Unnamed Group",
        participantsCount: g.participants?.length || 0,
      }));
      this.groupsCache = groupsList;
      return groupsList;
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      return this.groupsCache;
    }
  }

  public async sendMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.sock || this.status !== "connected") {
      return {
        success: false,
        error: "WhatsApp is not connected. Please scan the QR code first.",
      };
    }

    try {
      let recipientJid = to.trim();
      if (!recipientJid.includes("@")) {
        recipientJid = `${recipientJid}@g.us`;
      }
      const result = await this.sock.sendMessage(recipientJid, { text: message });
      return { success: true, messageId: result?.key?.id ?? undefined };
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : "Failed to send message.";
      console.error(`Failed to send WhatsApp message to ${to}:`, error);
      return { success: false, error: errMsg };
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
    } catch (err) {
      console.warn("WhatsApp logout error (safe to ignore):", err);
    } finally {
      this.status = "disconnected";
      this.sock = null;
      this.qrCodeDataUrl = null;
      this.rawQr = null;
      this.groupsCache = [];
      this.isInitializing = false;
      // Wipe credentials + state so next scan starts completely fresh
      await clearDbAuthState();
      await this.persistState();
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — preserved across Next.js dev hot-reloads
// ---------------------------------------------------------------------------

const globalForWhatsApp = globalThis as unknown as {
  whatsAppServiceInstance?: WhatsAppService;
};

export const whatsAppService =
  globalForWhatsApp.whatsAppServiceInstance ?? new WhatsAppService();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsApp.whatsAppServiceInstance = whatsAppService;
}
