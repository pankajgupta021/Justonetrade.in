import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { workerRequest } from "@/lib/whatsapp/worker-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    const data = await workerRequest("/status", "GET", undefined, 8_000);

    return NextResponse.json({
      success: true,
      status: data.status ?? "disconnected",
      qrCode: data.qrCode ?? null,
      groups: data.groups ?? [],
      connectedNumber: data.connectedNumber,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get status";
    // If the worker is unreachable, report disconnected rather than 500
    return NextResponse.json({
      success: true,
      status: "disconnected",
      qrCode: null,
      groups: [],
      connectedNumber: undefined,
      workerError: message,
    });
  }
}
