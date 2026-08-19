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
    this.authDir = path.join(process.cwd(), "auth_info_baileys");
  }

  public getStatus(): {
    status: WhatsAppStatus;
    qrCode: string | null;
    rawQr: string | null;
    groups: WhatsAppGroupInfo[];
    connectedNumber?: string;
  } {
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
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCodeDataUrl = null;
          this.rawQr = null;
          console.log("WhatsApp Baileys connected successfully!");
          await this.refreshGroups();
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
