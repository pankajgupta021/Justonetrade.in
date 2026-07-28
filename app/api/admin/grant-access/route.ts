import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN_PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { whatsappAccess: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grant access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
