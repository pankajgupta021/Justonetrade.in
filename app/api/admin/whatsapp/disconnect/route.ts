import { NextResponse } from "next/server";
import { whatsAppService } from "@/lib/whatsapp/baileys";

export async function POST() {
  try {
    await whatsAppService.disconnect();
    return NextResponse.json({ success: true, message: "Disconnected successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
