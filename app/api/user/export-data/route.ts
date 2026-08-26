import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        countryCode: true,
        contactNumber: true,
        role: true,
        isActive: true,
        hasUsedTrial: true,
        acceptedTermsAt: true,
        acceptedPrivacyAt: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          select: {
            id: true,
            status: true,
            planType: true,
            whatsappAccess: true,
            isRecurring: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          select: {
            id: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            amount: true,
            currency: true,
            isRecurring: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        sessions: {
          select: {
            id: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const exportPayload = {
      complianceMetadata: {
        exportedAt: new Date().toISOString(),
        serviceProvider: "JustOneTrade.in",
        regulation: "Digital Personal Data Protection Act (DPDP Act) 2023 - Right to Data Portability",
        userId: userData.id,
      },
      personalInformation: {
        id: userData.id,
        fullName: userData.fullName,
        email: userData.email,
        countryCode: userData.countryCode,
        contactNumber: userData.contactNumber,
        role: userData.role,
        isActive: userData.isActive,
        hasUsedTrial: userData.hasUsedTrial,
        acceptedTermsAt: userData.acceptedTermsAt,
        acceptedPrivacyAt: userData.acceptedPrivacyAt,
        registeredAt: userData.createdAt,
        lastUpdatedAt: userData.updatedAt,
      },
      subscriptions: userData.subscriptions,
      paymentTransactions: userData.payments,
      activeSessions: userData.sessions,
    };

    const fileName = `justonetrade_data_export_${userData.id.substring(0, 8)}_${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export user data. Please try again later." },
      { status: 500 }
    );
  }
}
