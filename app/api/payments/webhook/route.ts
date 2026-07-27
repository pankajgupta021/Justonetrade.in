import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle payment capture / subscription charge
    if (event.event === "payment.captured" || event.event === "subscription.charged") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id || event.payload.subscription?.entity?.id;

      if (!orderId) {
        return NextResponse.json({ success: true, message: "No order/subscription ID found, skipping." });
      }

      await prisma.$transaction(async (tx) => {
        // Find the pending transaction
        const transaction = await tx.paymentTransaction.findUnique({
          where: { razorpayOrderId: orderId }
        });

        if (!transaction) return;

        // If it's already success, skip to avoid double processing
        if (transaction.status === "SUCCESS") return;

        // Update transaction
        await tx.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            razorpayPaymentId: paymentEntity.id,
            status: "SUCCESS",
          },
        });

        // Grant 30 days subscription
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const existingSubscription = await tx.subscription.findFirst({
          where: { userId: transaction.userId },
        });

        if (existingSubscription) {
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
          await tx.subscription.create({
            data: {
              userId: transaction.userId,
              status: "ACTIVE",
              currentPeriodStart: now,
              currentPeriodEnd: expiresAt,
            },
          });
        }
      });
    }

    // Handle payment failure
    if (event.event === "payment.failed") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      if (orderId) {
        await prisma.paymentTransaction.updateMany({
          where: { razorpayOrderId: orderId },
          data: { status: "FAILED" }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
