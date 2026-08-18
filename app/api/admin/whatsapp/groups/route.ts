import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { whatsAppService } from "@/lib/whatsapp/baileys";

export async function GET() {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    const groups = await whatsAppService.refreshGroups();
    return NextResponse.json({ success: true, groups });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch groups";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
