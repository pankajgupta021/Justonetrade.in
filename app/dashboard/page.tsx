import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function UserDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  return <DashboardContent user={user} />;
}
