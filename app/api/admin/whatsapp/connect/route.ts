import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { whatsAppService } from "@/lib/whatsapp/baileys";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    let forceNew = false;
    try {
      const body = await req.json();
      if (body?.forceNew) {
        forceNew = true;
      }
    } catch {
      // Body is optional
    }

    const initResult = await whatsAppService.initialize(forceNew);
    const currentStatus = whatsAppService.getStatus();

    return NextResponse.json({
      success: true,
      ...currentStatus,
      status: initResult.status || currentStatus.status,
      qrCode: initResult.qrCode || currentStatus.qrCode,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to connect";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
