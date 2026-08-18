import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { whatsAppService } from "@/lib/whatsapp/baileys";

export async function POST() {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    await whatsAppService.disconnect();
    return NextResponse.json({ success: true, message: "Disconnected successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
