import Link from "next/link";
import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5" />
              <span className="font-bold tracking-tight">JustOneTrade.in</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-4 max-w-sm">
              Premium technical analysis and educational chart studies for SPX Index Options, delivered straight to your WhatsApp.
            </p>
            <div className="p-4 bg-muted rounded-lg text-xs text-muted-foreground">
              <strong>Disclaimer:</strong> JustOneTrade.in provides educational technical analysis and chart studies only. We are not SEBI registered advisors. We do not provide buy/sell recommendations, trade signals, execution services, or personalized financial advice. All analysis is for learning purposes only. Trading involves significant risk.
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="/#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JustOneTrade.in. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
