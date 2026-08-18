import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { prisma } from "@/lib/prisma";

export default async function UserDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  const [dbUser, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { hasUsedTrial: true }
    }),
    prisma.subscription.findFirst({
      where: { 
        userId: user.id,
        status: "ACTIVE",
        currentPeriodEnd: { gt: new Date() } // Ensure it's not expired
      },
      orderBy: { currentPeriodEnd: "desc" }
    })
  ]);

  const dashboardUserData = {
    ...user,
    hasUsedTrial: !!dbUser?.hasUsedTrial,
  };

  const subscriptionData = subscription ? {
    id: subscription.id,
    planType: subscription.planType || "MONTHLY",
    status: subscription.status,
    whatsappAccess: subscription.whatsappAccess,
    isRecurring: subscription.isRecurring,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
  } : null;

  return (
    <DashboardContent 
      user={dashboardUserData} 
      subscription={subscriptionData}
      hasActiveSubscription={!!subscription} 
      whatsappAccessGranted={!!subscription?.whatsappAccess}
    />
  );
}
