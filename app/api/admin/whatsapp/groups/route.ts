import { NextResponse } from "next/server";
import { whatsAppService } from "@/lib/whatsapp/baileys";

export async function GET() {
  try {
    const groups = await whatsAppService.refreshGroups();
    return NextResponse.json({ success: true, groups });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch groups";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
