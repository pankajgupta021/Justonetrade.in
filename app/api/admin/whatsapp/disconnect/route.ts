import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { workerRequest } from "@/lib/whatsapp/worker-client";

export async function POST() {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    await workerRequest("/disconnect", "POST", undefined, 10_000);
    return NextResponse.json({ success: true, message: "Disconnected successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to disconnect";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
