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
    const {
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    const isSubscription = !!razorpay_subscription_id;

    let generatedSignature: string;
    let lookupId: string;

    if (isSubscription) {
      generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_payment_id + "|" + razorpay_subscription_id)
        .digest("hex");
      lookupId = razorpay_subscription_id;
    } else {
      if (!razorpay_order_id) {
        return NextResponse.json({ success: false, error: "Missing order_id" }, { status: 400 });
      }
      generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
      lookupId = razorpay_order_id;
    }

    if (generatedSignature !== razorpay_signature) {
      console.error("Signature mismatch", {
        isSubscription,
        lookupId,
        expected: generatedSignature,
        received: razorpay_signature,
      });
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.findUnique({
        where: { razorpayOrderId: lookupId },
      });

      if (!transaction) {
        throw new Error(`Transaction not found for ID: ${lookupId}`);
      }

      if (transaction.userId !== session.user.id) {
        throw new Error(`Unauthorized payment verification attempt.`);
      }

      if (transaction.status === "SUCCESS") {
        return;
      }

      const updateResult = await tx.paymentTransaction.updateMany({
        where: { id: transaction.id, status: "PENDING" },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "SUCCESS",
        },
      });

      if (updateResult.count === 0) {
        return;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const existingSubscription = await tx.subscription.findFirst({
        where: { userId: session.user.id },
      });

      if (existingSubscription) {
        const baseDate = existingSubscription.currentPeriodEnd > now
          ? existingSubscription.currentPeriodEnd
          : now;
        const newExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "ACTIVE",
            currentPeriodEnd: newExpiresAt,
            isRecurring: isSubscription,
            razorpaySubscriptionId: isSubscription ? razorpay_subscription_id : existingSubscription.razorpaySubscriptionId,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            userId: session.user.id,
            status: "ACTIVE",
            isRecurring: isSubscription,
            razorpaySubscriptionId: isSubscription ? razorpay_subscription_id : null,
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
