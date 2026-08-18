import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientKey(request, 'start-trial'), { limit: 5, windowSecs: 3600 });
  if (!rl.success) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } }
    );
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          where: {
            status: "ACTIVE",
            currentPeriodEnd: { gt: new Date() },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (user.subscriptions.length > 0) {
      return NextResponse.json({
        success: false,
        error: "You already have an active subscription.",
      }, { status: 400 });
    }

    if (user.hasUsedTrial) {
      return NextResponse.json({
        success: false,
        error: "You have already used your 2-Day Free Trial.",
      }, { status: 400 });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          userId: user.id,
          status: "ACTIVE",
          planType: "TRIAL",
          whatsappAccess: false,
          isRecurring: false,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { hasUsedTrial: true },
      });

      return sub;
    });

    return NextResponse.json({
      success: true,
      message: "2-Day Free Trial activated successfully!",
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        currentPeriodEnd: subscription.currentPeriodEnd,
        whatsappAccess: subscription.whatsappAccess,
      },
    });
  } catch (error: unknown) {
    console.error("Error starting free trial:", error);
    return NextResponse.json({ success: false, error: "Failed to activate free trial." }, { status: 500 });
  }
}
