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

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      if (!orderId) {
        return NextResponse.json({ success: true, message: "No order_id, skipping." });
      }

      await prisma.$transaction(async (tx) => {
        const transaction = await tx.paymentTransaction.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (!transaction) return;
        if (transaction.status === "SUCCESS") return;

        if (transaction.amount !== paymentEntity.amount) {
          console.error(`FRAUD ALERT: Amount mismatch for order ${orderId}! Expected: ${transaction.amount}, Received: ${paymentEntity.amount}. Marking transaction as FAILED for manual review.`);
          await tx.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: "FAILED" },
          });
          return;
        }

        const updateResult = await tx.paymentTransaction.updateMany({
          where: { id: transaction.id, status: "PENDING" },
          data: {
            razorpayPaymentId: paymentEntity.id,
            status: "SUCCESS",
          },
        });

        if (updateResult.count === 0) return;

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const existingSubscription = await tx.subscription.findFirst({
          where: { userId: transaction.userId },
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

    if (event.event === "subscription.charged") {
      const paymentEntity = event.payload.payment.entity;
      const subscriptionEntity = event.payload.subscription?.entity;
      const subscriptionId = subscriptionEntity?.id;

      if (!subscriptionId) {
        return NextResponse.json({ success: true, message: "No subscription_id, skipping." });
      }

      await prisma.$transaction(async (tx) => {
        const originalTransaction = await tx.paymentTransaction.findUnique({
          where: { razorpayOrderId: subscriptionId },
        });

        if (!originalTransaction) return;

        const existingPayment = await tx.paymentTransaction.findUnique({
          where: { razorpayPaymentId: paymentEntity.id },
        });

        if (existingPayment && existingPayment.status === "SUCCESS") {
          return;
        }

        if (!existingPayment) {
          await tx.paymentTransaction.create({
            data: {
              userId: originalTransaction.userId,
              razorpayOrderId: `${subscriptionId}_${paymentEntity.id}`,
              razorpayPaymentId: paymentEntity.id,
              amount: paymentEntity.amount,
              currency: paymentEntity.currency,
              isRecurring: true,
              status: "SUCCESS",
            }
          });
        } else {
          const updateResult = await tx.paymentTransaction.updateMany({
            where: { id: existingPayment.id, status: "PENDING" },
            data: { status: "SUCCESS" }
          });
          if (updateResult.count === 0) return;
        }

        const expiresAt = new Date(subscriptionEntity.current_end * 1000);
        const now = new Date();

        const existingSubscription = await tx.subscription.findFirst({
          where: { userId: originalTransaction.userId },
        });

        if (existingSubscription) {
          await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: "ACTIVE",
              currentPeriodEnd: expiresAt,
              razorpaySubscriptionId: subscriptionId,
            },
          });
        } else {
          await tx.subscription.create({
            data: {
              userId: originalTransaction.userId,
              status: "ACTIVE",
              isRecurring: true,
              razorpaySubscriptionId: subscriptionId,
              currentPeriodStart: now,
              currentPeriodEnd: expiresAt,
            },
          });
        }
      });
    }

    if (event.event === "payment.failed") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      if (orderId) {
        await prisma.paymentTransaction.updateMany({
          where: { razorpayOrderId: orderId, status: "PENDING" },
          data: { status: "FAILED" },
        });
      }
    }

    if (event.event === "subscription.cancelled") {
      const subscriptionEntity = event.payload.subscription?.entity;
      const subscriptionId = subscriptionEntity?.id;

      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { razorpaySubscriptionId: subscriptionId },
          data: { status: "CANCELLED" },
        });
      }
    }

    if (event.event === "subscription.expired" || event.event === "subscription.completed") {
      const subscriptionEntity = event.payload.subscription?.entity;
      const subscriptionId = subscriptionEntity?.id;

      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { razorpaySubscriptionId: subscriptionId },
          data: { status: "EXPIRED" },
        });
      }
    }

    if (event.event === "subscription.halted") {
      const subscriptionEntity = event.payload.subscription?.entity;
      const subscriptionId = subscriptionEntity?.id;

      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { razorpaySubscriptionId: subscriptionId },
          data: { status: "EXPIRED" },
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
