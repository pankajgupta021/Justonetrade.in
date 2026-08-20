import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay keys not found in environment variables.");
      return NextResponse.json(
        { success: false, error: "Payment gateway configuration error." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan === "yearly" ? "yearly" : "monthly";

    const amount = plan === "yearly" ? 10000000 : 100000;
    const currency = "INR";

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount,
      currency,
      receipt: `rcpt_${plan}_${Date.now()}_${session.user.id.substring(0, 4)}`,
      payment_capture: 1,
      notes: {
        userId: session.user.id,
        planType: plan.toUpperCase(),
      },
    };

    const order = await razorpay.orders.create(options);

    await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: order.id,
        amount: amount,
        currency: currency,
        isRecurring: false,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        plan,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating Razorpay order:", error);
    const message = error instanceof Error ? error.message : "Failed to initialize payment.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
