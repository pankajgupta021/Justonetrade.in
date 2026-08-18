import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN_PROVIDER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const now = new Date();
    let durationDays = 30; // default monthly

    if (sub.planType === "TRIAL") {
      durationDays = 2; // 2 days for trial
    } else if (sub.planType === "YEARLY") {
      durationDays = 365; // 365 days for yearly
    }

    const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        whatsappAccess: true,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd,
      },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: unknown) {
    console.error("Grant access error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

