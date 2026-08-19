/**
 * Thin HTTP client for the whatsapp-worker service.
 *
 * All five Vercel WhatsApp API routes use this instead of calling Baileys directly.
 * The admin UI is unchanged — it still hits the same /api/admin/whatsapp/* URLs.
 */

function getWorkerConfig(): { url: string; secret: string } {
  const url = process.env.WHATSAPP_WORKER_URL || "http://localhost:3001";
  const secret = process.env.WHATSAPP_WORKER_SECRET || "change_me_to_a_strong_random_secret";

  return { url, secret };
}

interface WorkerResponse {
  success?: boolean;
  status?: string;
  qrCode?: string | null;
  groups?: { id: string; name: string; participantsCount?: number }[];
  connectedNumber?: string;
  messageId?: string;
  error?: string;
  whatsapp?: string;
}

/**
 * Make an authenticated request to the worker.
 * @param path    e.g. "/status"
 * @param method  GET | POST
 * @param body    Optional JSON body for POST requests
 * @param timeoutMs Request timeout in milliseconds (default 15s)
 */
export async function workerRequest(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>,
  timeoutMs = 30_000
): Promise<WorkerResponse> {
  const { url, secret } = getWorkerConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = (await res.json()) as WorkerResponse;
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Worker request to ${path} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
