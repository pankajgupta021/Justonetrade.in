import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { workerRequest } from "@/lib/whatsapp/worker-client";

export async function GET() {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    const data = await workerRequest("/groups", "GET", undefined, 12_000);
    return NextResponse.json({ success: true, groups: data.groups ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch groups";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
