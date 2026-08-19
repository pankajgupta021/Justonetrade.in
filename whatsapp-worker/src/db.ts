/**
 * Raw pg queries for the two WhatsApp tables.
 * Optimized with batching to handle burst writes when Baileys syncs keys.
 */

import { Pool } from "pg";
import { logger } from "./logger";

if (!process.env.DATABASE_URL) {
  logger.fatal("DATABASE_URL environment variable is required");
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected Postgres pool error");
});

// ── WhatsAppAuth (key-value store for Baileys credentials) ──────────────────

export async function authGet(key: string): Promise<string | null> {
  const res = await pool.query<{ value: string }>(
    'SELECT value FROM "WhatsAppAuth" WHERE key = $1',
    [key]
  );
  return res.rows[0]?.value ?? null;
}

export async function authGetMany(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  const res = await pool.query<{ key: string; value: string }>(
    'SELECT key, value FROM "WhatsAppAuth" WHERE key = ANY($1)',
    [keys]
  );
  const result: Record<string, string> = {};
  for (const row of res.rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function authSet(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO "WhatsAppAuth" (key, value, "updatedAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [key, value]
  );
}

export async function authSetMany(entries: { key: string; value: string }[]): Promise<void> {
  if (entries.length === 0) return;
  const keys = entries.map((e) => e.key);
  const values = entries.map((e) => e.value);
  await pool.query(
    `INSERT INTO "WhatsAppAuth" (key, value, "updatedAt")
     SELECT k, v, NOW()
     FROM UNNEST($1::text[], $2::text[]) AS t(k, v)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [keys, values]
  );
}

export async function authDelete(key: string): Promise<void> {
  await pool.query('DELETE FROM "WhatsAppAuth" WHERE key = $1', [key]);
}

export async function authDeleteMany(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await pool.query('DELETE FROM "WhatsAppAuth" WHERE key = ANY($1)', [keys]);
}

export async function authDeleteAll(): Promise<void> {
  await pool.query('DELETE FROM "WhatsAppAuth"');
}

// ── WhatsAppState (single-row status + QR) ──────────────────────────────────

export interface StateRow {
  status: string;
  qrCodeDataUrl: string | null;
  connectedNumber: string | null;
  groupsJson: string;
}

export async function statePersist(row: StateRow): Promise<void> {
  await pool.query(
    `INSERT INTO "WhatsAppState" (key, status, "qrCodeDataUrl", "connectedNumber", "groupsJson", "updatedAt")
     VALUES ('singleton', $1, $2, $3, $4, NOW())
     ON CONFLICT (key) DO UPDATE SET
       status = EXCLUDED.status,
       "qrCodeDataUrl" = EXCLUDED."qrCodeDataUrl",
       "connectedNumber" = EXCLUDED."connectedNumber",
       "groupsJson" = EXCLUDED."groupsJson",
       "updatedAt" = NOW()`,
    [row.status, row.qrCodeDataUrl, row.connectedNumber, row.groupsJson]
  );
}
