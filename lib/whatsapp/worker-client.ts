function getWorkerConfig(): { url: string; secret: string } {
  let url = process.env.WHATSAPP_WORKER_URL?.trim();
  const secret = process.env.WHATSAPP_WORKER_SECRET?.trim() || "change_me_to_a_strong_random_secret";

  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "WHATSAPP_WORKER_URL is missing in Vercel Environment Variables. Add your Render worker URL (e.g. https://your-service.onrender.com) in Vercel Dashboard."
      );
    }
    url = "http://localhost:3001";
  }

  const cleanUrl = url.replace(/\/+$/, "");

  return { url: cleanUrl, secret };
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
 * @param timeoutMs Request timeout in milliseconds (default 30s)
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

  const endpoint = `${url}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(endpoint, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    let data: WorkerResponse;
    try {
      data = (await res.json()) as WorkerResponse;
    } catch {
      throw new Error(`Worker returned non-JSON response (HTTP ${res.status}: ${res.statusText}) from ${endpoint}`);
    }

    if (!res.ok) {
      throw new Error(data.error || `Worker responded with HTTP ${res.status} from ${endpoint}`);
    }

    return data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Worker request to ${endpoint} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
