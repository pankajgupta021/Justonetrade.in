import { NextResponse } from "next/server";
import { whatsAppService } from "@/lib/whatsapp/baileys";

export async function POST() {
  try {
    await whatsAppService.initialize();
    const status = whatsAppService.getStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to connect";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
