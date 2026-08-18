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

    // Use timing-safe comparison to prevent timing oracle attacks.
    // timingSafeEqual requires equal-length buffers; a length mismatch is an immediate fail.
    const expectedBuf = Buffer.from(generatedSignature, "hex");
    const receivedBuf = Buffer.from(razorpay_signature, "hex");
    const signaturesMatch =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!signaturesMatch) {
      // Log only non-sensitive context — never log expected/received signature values
      console.error("Signature mismatch", { isSubscription, lookupId });
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.findUnique({
        where: { razorpayOrderId: lookupId },
      });

      if (!transaction) {
        throw Object.assign(new Error("Transaction not found"), { code: "NOT_FOUND" });
      }

      if (transaction.userId !== session.user.id) {
        throw Object.assign(new Error("Unauthorized payment verification attempt"), { code: "FORBIDDEN" });
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

      const isYearly = transaction.amount >= 2000000; // >= ₹20,000 is Yearly
      const durationDays = isYearly ? 365 : 30;
      const planType = isYearly ? "YEARLY" : "MONTHLY";

      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const existingSubscription = await tx.subscription.findFirst({
        where: { userId: session.user.id },
      });

      if (existingSubscription) {
        const baseDate = existingSubscription.currentPeriodEnd > now
          ? existingSubscription.currentPeriodEnd
          : now;
        const newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "ACTIVE",
            planType: planType,
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
            planType: planType,
            isRecurring: isSubscription,
            razorpaySubscriptionId: isSubscription ? razorpay_subscription_id : null,
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error: unknown) {
    console.error("Error verifying Razorpay payment:", error);

    // Map specific coded errors to appropriate HTTP responses without leaking internals
    if (error instanceof Error) {
      const coded = error as Error & { code?: string };
      if (coded.code === "FORBIDDEN") {
        return NextResponse.json(
          { success: false, error: "Payment verification failed." },
          { status: 403 }
        );
      }
      if (coded.code === "NOT_FOUND") {
        return NextResponse.json(
          { success: false, error: "Payment verification failed." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Payment verification failed." },
      { status: 500 }
    );
  }
}

