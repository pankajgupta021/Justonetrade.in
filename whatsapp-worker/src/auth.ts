import type { Request, Response, NextFunction } from "express";

const secret = process.env.WHATSAPP_WORKER_SECRET;

if (!secret) {
  // Crash early — never start without a secret
  console.error("[auth] WHATSAPP_WORKER_SECRET is not set. Refusing to start.");
  process.exit(1);
}

/**
 * Express middleware that requires a valid Bearer token.
 * The token must match WHATSAPP_WORKER_SECRET exactly.
 */
export function requireSecret(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || token !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
