import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Activity, User } from "lucide-react";
import { getSession } from "@/lib/auth/session";

export async function Navbar() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            <span className="font-bold tracking-tight">JustOneTrade.in</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80">Home</Link>
          <Link href="/#about-us" className="transition-colors hover:text-foreground/80">About Us</Link>
          <Link href="/#services" className="transition-colors hover:text-foreground/80">Services</Link>
          <Link href="/contact" className="transition-colors hover:text-foreground/80">Contact</Link>

        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href={user.role === "ADMIN_PROVIDER" ? "/admin" : "/dashboard"}
              className={buttonVariants({ variant: "outline", className: "rounded-full px-6 gap-2" })}
            >
              <User className="h-4 w-4" />
              {user.fullName.split(" ")[0]}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex text-sm font-medium transition-colors hover:text-foreground/80">
                Login
              </Link>
              <Link href="/signup" className={buttonVariants({ className: "rounded-full px-6" })}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
