import { TechnicalStudyChart } from "@/components/shared/TechnicalStudyChart";
import { WhatsAppDirectSignalGenerator } from "@/components/admin/WhatsAppDirectSignalGenerator";
import { AdminProfileButton } from "@/components/admin/AdminProfileButton";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN_PROVIDER") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Signal Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Live SPX FD technical chart study and 1-click WhatsApp signal execution.
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <AdminProfileButton email={session.user.email} />
        </div>
      </div>

      {/* 1. TOP: Live SPX Technical Study Chart (customizable 5m to 4h) */}
      <div className="w-full">
        <TechnicalStudyChart defaultTimeframe="5" height={520} />
      </div>

      {/* 2. BELOW: All Call / Put / Buy / Sell / Exit Signal Options */}
      <div className="w-full">
        <WhatsAppDirectSignalGenerator />
      </div>
    </div>
  );
}

