import { prisma } from "@/lib/prisma";
import { SubscriberTable } from "@/components/admin/SubscriberTable";

export default async function AdminSubscribersPage() {
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

  return (
    <div className="flex flex-col gap-6 w-full mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriber Management</h1>
        <p className="text-muted-foreground mt-1">
          Verify payments and grant WhatsApp access to your subscribers.
        </p>
      </div>

      <div className="w-full">
        <SubscriberTable users={users as any} />
      </div>
    </div>
  );
}
