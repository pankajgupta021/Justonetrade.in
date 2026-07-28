import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminSidebarLayout } from "@/components/admin/AdminSidebarLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN_PROVIDER") {
    redirect("/login");
  }

  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}
