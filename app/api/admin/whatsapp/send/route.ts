import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { whatsAppService } from "@/lib/whatsapp/baileys";

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    const body = await req.json();
    const { groupId, message } = body;

    if (!groupId) {
      return NextResponse.json({ success: false, error: "Target Group ID is required." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ success: false, error: "Message content cannot be empty." }, { status: 400 });
    }

    const result = await whatsAppService.sendMessage(groupId, message);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
