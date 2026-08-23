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

    const planId = process.env.RAZORPAY_PLAN_ID;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !planId) {
      console.error("Razorpay keys or Plan ID not found in environment variables.");
      return NextResponse.json(
        { success: false, error: "Payment gateway configuration error. Missing Plan ID." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      plan_id: planId,
      total_count: 120,
      customer_notify: 1 as const,
    };

    const subscription = await razorpay.subscriptions.create(options);

    await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: subscription.id,
        amount: 200, // $100 in cents
        currency: "USD",
        isRecurring: true,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription_id: subscription.id,
        plan_id: planId,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize subscription." },
      { status: 500 }
    );
  }
}
