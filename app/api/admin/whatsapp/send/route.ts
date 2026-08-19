import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { workerRequest } from "@/lib/whatsapp/worker-client";

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized) return auth.response!;

  try {
    const body = await req.json();
    const { groupId, message } = body;

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: "Target Group ID is required." },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    const data = await workerRequest("/send-message", "POST", { groupId, message }, 25_000);

    if (!data.success) {
      return NextResponse.json({ success: false, error: data.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: data.messageId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
