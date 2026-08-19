import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { workerRequest } from "@/lib/whatsapp/worker-client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    let forceNew = false;
    try {
      const body = await req.json();
      if (body?.forceNew) forceNew = true;
    } catch {
      // body is optional
    }

    const data = await workerRequest("/connect", "POST", { forceNew }, 20_000);

    return NextResponse.json({
      success: true,
      status: data.status,
      qrCode: data.qrCode ?? null,
      groups: data.groups ?? [],
      connectedNumber: data.connectedNumber,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
