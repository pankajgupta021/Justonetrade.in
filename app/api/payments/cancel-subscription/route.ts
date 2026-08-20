import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: "Payment gateway configuration error." },
        { status: 500 }
      );
    }

    // Find user's active recurring subscription
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: session.user.id,
        isRecurring: true,
        status: "ACTIVE",
        razorpaySubscriptionId: { not: null }
      },
    });

    if (!subscription || !subscription.razorpaySubscriptionId) {
      return NextResponse.json(
        { success: false, error: "No active recurring subscription found." },
        { status: 404 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Cancel the subscription at Razorpay at the end of the billing cycle
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, true);

    // Update the database to reflect it's no longer recurring, but keep the current access until it expires
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        isRecurring: false,
        // Optional: you can set status to "CANCELLED" if you want to revoke access immediately, 
        // but typically you let them keep access until currentPeriodEnd.
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully. You will not be charged again.",
    });
  } catch (error: unknown) {
    console.error("Error cancelling subscription:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel subscription.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
