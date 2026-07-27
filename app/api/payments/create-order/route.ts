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

    // Hardcode the amount in backend: 39 USD = 3900 cents
    const amount = 3900;
    const currency = "USD";

    const options = {
      amount,
      currency,
      receipt: `receipt_${Date.now()}_${session.user.id.substring(0, 5)}`,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);

    // Save the pending transaction in our database
    await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: order.id,
        amount: amount,
        currency: currency,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID, // Safe to expose public key
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
