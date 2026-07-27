import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // Wrap the updates in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Payment Transaction
      await tx.paymentTransaction.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "SUCCESS",
        },
      });

      // 2. Grant or extend Subscription (30 days from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const existingSubscription = await tx.subscription.findFirst({
        where: { userId: session.user.id },
      });

      if (existingSubscription) {
        // If they already have an active sub, extend it from its current end date or now
        const baseDate = existingSubscription.currentPeriodEnd > now ? existingSubscription.currentPeriodEnd : now;
        const newExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "ACTIVE",
            currentPeriodEnd: newExpiresAt,
          },
        });
      } else {
        // Create new subscription
        await tx.subscription.create({
          data: {
            userId: session.user.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment." },
      { status: 500 }
    );
  }
}
