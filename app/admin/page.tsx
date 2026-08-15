import { WhatsAppDirectSignalGenerator } from "@/components/admin/WhatsAppDirectSignalGenerator";

export default async function AdminDashboardPage() {
  return (
    <div className="flex items-center justify-center w-full max-w-2xl mx-auto h-full py-4">
      <div className="w-full">
        <WhatsAppDirectSignalGenerator />
      </div>
    </div>
  );
}


