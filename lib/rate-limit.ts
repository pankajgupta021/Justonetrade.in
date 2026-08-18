/**
 * In-process sliding-window rate limiter.
 *
 * Suitable for single-process deployments (e.g. Vercel serverless functions with
 * sticky lambdas, self-hosted Node). For multi-instance deployments, replace the
 * `store` Map with a Redis-backed counter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms timestamp when the window resets
}

// Global map survives module reloads in dev (Next.js HMR)
const globalStore = globalThis as typeof globalThis & {
  _rateLimitStore?: Map<string, RateLimitEntry>;
};
const store: Map<string, RateLimitEntry> = (globalStore._rateLimitStore ??= new Map());

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSecs: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix ms timestamp when the current window resets */
  resetAt: number;
}

/**
 * Check and increment the rate-limit counter for a given key.
 * The key should uniquely identify the caller (e.g. IP address + route).
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSecs * 1000;

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // Start a fresh window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: options.limit - 1, resetAt };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Derive a stable client key from a Next.js Request.
 * Uses X-Forwarded-For (set by Vercel/proxies) then falls back to the raw
 * remote address. Suffix with the route name to create per-route buckets.
 */
export function getClientKey(request: Request, route: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${ip}:${route}`;
}
