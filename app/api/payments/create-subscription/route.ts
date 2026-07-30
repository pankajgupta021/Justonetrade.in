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

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_PLAN_ID) {
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
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: 120,
      customer_notify: 1 as const,
    };

    const subscription = await razorpay.subscriptions.create(options);

    await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: subscription.id,
        amount: 325000,
        currency: "INR",
        isRecurring: true,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription_id: subscription.id,
        plan_id: process.env.RAZORPAY_PLAN_ID,
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
