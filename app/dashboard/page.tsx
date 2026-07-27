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

  const subscription = await prisma.subscription.findFirst({
    where: { 
      userId: user.id,
      status: "ACTIVE",
      currentPeriodEnd: { gt: new Date() } // Ensure it's not expired
    }
  });

  return (
    <DashboardContent 
      user={user} 
      hasActiveSubscription={!!subscription} 
      whatsappAccessGranted={!!subscription?.whatsappAccess}
    />
  );
}
