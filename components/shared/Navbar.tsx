import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Activity } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            <span className="font-bold tracking-tight">JustOneTrade.in</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80">Home</Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-foreground/80">How It Works</Link>
          <Link href="/#pricing" className="transition-colors hover:text-foreground/80">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:inline-flex text-sm font-medium transition-colors hover:text-foreground/80">
            Login
          </Link>
          <Link href="/signup" className={buttonVariants({ className: "rounded-full px-6" })}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
