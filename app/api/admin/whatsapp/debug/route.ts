import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint to verify Vercel ↔ Worker connectivity.
 * Hit this from browser: /api/admin/whatsapp/debug
 */
export async function GET() {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  const workerUrl = process.env.WHATSAPP_WORKER_URL?.trim();
  const workerSecret = process.env.WHATSAPP_WORKER_SECRET?.trim();

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      WHATSAPP_WORKER_URL: workerUrl ? `${workerUrl.substring(0, 30)}...` : "NOT SET",
      WHATSAPP_WORKER_SECRET: workerSecret ? `${workerSecret.substring(0, 6)}...` : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  if (!workerUrl) {
    result.error = "WHATSAPP_WORKER_URL is not set in environment variables";
    return NextResponse.json(result, { status: 500 });
  }

  // Test 1: Health check (no auth needed)
  try {
    const healthRes = await fetch(`${workerUrl.replace(/\/+$/, "")}/health`, {
      signal: AbortSignal.timeout(10000),
    });
    const healthBody = await healthRes.text();
    result.healthCheck = {
      httpStatus: healthRes.status,
      body: healthBody.substring(0, 500),
    };
  } catch (err) {
    result.healthCheck = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Test 2: Status check (with auth)
  try {
    const statusRes = await fetch(`${workerUrl.replace(/\/+$/, "")}/status`, {
      headers: {
        Authorization: `Bearer ${workerSecret}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    const statusBody = await statusRes.text();
    result.statusCheck = {
      httpStatus: statusRes.status,
      body: statusBody.substring(0, 500),
    };
  } catch (err) {
    result.statusCheck = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Test 3: Connect attempt (with auth)
  try {
    const connectRes = await fetch(`${workerUrl.replace(/\/+$/, "")}/connect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ forceNew: false }),
      signal: AbortSignal.timeout(25000),
    });
    const connectBody = await connectRes.text();
    result.connectCheck = {
      httpStatus: connectRes.status,
      bodyLength: connectBody.length,
      // Truncate QR data but show everything else
      body: connectBody.length > 500
        ? connectBody.substring(0, 200) + "...(truncated)..."
        : connectBody,
    };
  } catch (err) {
    result.connectCheck = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  return NextResponse.json(result);
}
