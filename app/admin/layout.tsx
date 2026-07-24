"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  LineChart, 
  Activity, 
  Users, 
  CreditCard, 
  Settings,
  LogOut
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "NIFTY Market",
    href: "/admin/market",
    icon: LineChart,
  },
  {
    title: "Signals",
    href: "/admin/signals",
    icon: Activity,
  },
  {
    title: "Subscribers",
    href: "/admin/subscribers",
    icon: Users,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-muted/10">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 border-r bg-card flex flex-col shrink-0">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">Admin Portal</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {sidebarNavItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : ""}`} />
                {item.title}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto border-t">
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "w-full justify-start text-muted-foreground hover:text-foreground" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
