import { SignalGenerator } from "@/components/admin/SignalGenerator";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  return (
    <div className="flex items-center justify-center w-full max-w-2xl mx-auto h-full">
      <div className="w-full">
        <SignalGenerator />
      </div>
    </div>
  );
}
