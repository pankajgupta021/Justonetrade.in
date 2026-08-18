import { prisma } from "@/lib/prisma";
import { SubscriberTable } from "@/components/admin/SubscriberTable";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminSubscribersPage() {
  // Defense-in-depth: verify admin role directly in this server component
  // (AdminLayout already redirects, but this ensures the DB query never runs for non-admins)
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN_PROVIDER") {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    where: {
      role: "SUBSCRIBER"
    },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
          currentPeriodEnd: { gt: new Date() }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const serializedUsers = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    hasUsedTrial: u.hasUsedTrial,
    createdAt: u.createdAt.toISOString(),
    subscriptions: u.subscriptions.map((s) => ({
      id: s.id,
      whatsappAccess: s.whatsappAccess,
      planType: s.planType,
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      isRecurring: s.isRecurring,
    })),
  }));

  return (
    <div className="flex flex-col gap-6 w-full mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriber Management</h1>
        <p className="text-muted-foreground mt-1">
          Verify payments and grant WhatsApp access to your subscribers.
        </p>
      </div>

      <div className="w-full">
        <SubscriberTable users={serializedUsers} />
      </div>
    </div>
  );
}
