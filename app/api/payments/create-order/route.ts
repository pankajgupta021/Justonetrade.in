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
      console.error("Razorpay keys not found in environment variables.");
      return NextResponse.json(
        { success: false, error: "Payment gateway configuration error." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = 1000000; // in paise
    const currency = "INR";

    const options = {
      amount,
      currency,
      receipt: `receipt_${Date.now()}_${session.user.id.substring(0, 5)}`,
      payment_capture: 1,
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
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize payment." },
      { status: 500 }
    );
  }
}
