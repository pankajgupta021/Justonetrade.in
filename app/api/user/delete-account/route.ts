import { NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit account deletion requests (5 per hour per IP)
  const rl = checkRateLimit(getClientKey(request, "delete-account"), { limit: 5, windowSecs: 3600 });
  if (!rl.success) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    );
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = session.user.id;

    // Safety guard: prevent accidental deletion of administrator accounts from standard user dashboard
    if (session.user.role === "ADMIN_PROVIDER") {
      return NextResponse.json(
        { success: false, error: "Administrator accounts cannot be deleted from the user dashboard." },
        { status: 403 }
      );
    }

    // Delete user from database (Cascades deletion to Sessions, Subscriptions, and PaymentTransactions)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Clear session cookies
    await deleteSession();

    return NextResponse.json({
      success: true,
      message: "Your profile, subscriptions, and all associated personal data have been permanently deleted.",
    });
  } catch (error: unknown) {
    console.error("Error deleting user profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account. Please contact support if the issue persists." },
      { status: 500 }
    );
  }
}
