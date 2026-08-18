"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  CreditCard, 
  MessageCircle, 
  LogOut, 
  Clock, 
  Sparkles, 
  Crown,
  Zap,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";

interface DashboardUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  hasUsedTrial: boolean;
}

interface SubscriptionInfo {
  id: string;
  planType: string;
  status: string;
  whatsappAccess: boolean;
  isRecurring: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export function DashboardContent({ 
  user, 
  subscription,
  hasActiveSubscription, 
  whatsappAccessGranted
}: { 
  user: DashboardUser;
  subscription: SubscriptionInfo | null;
  hasActiveSubscription: boolean;
  whatsappAccessGranted: boolean;
}) {
  const router = useRouter();
  const [showUpgradeSection, setShowUpgradeSection] = useState(false);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Calculate time remaining
  const getTimeRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diffMs = end - now;

    if (diffMs <= 0) return "Expired";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 2) {
      return `${diffDays} days remaining`;
    } else if (diffHours >= 1) {
      return `${diffHours} hours remaining`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes remaining`;
    }
  };

  const isTrial = subscription?.planType === "TRIAL";
  const isYearly = subscription?.planType === "YEARLY";

  return (
    <div className="flex-1 flex flex-col py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              {hasActiveSubscription && (
                <Badge className={
                  isTrial 
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold" 
                    : isYearly 
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold"
                    : "bg-primary/15 text-primary border-primary/30 font-bold"
                }>
                  {isTrial ? "2-Day Free Trial" : isYearly ? "👑 Yearly VIP" : "💎 Monthly Pass"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">Welcome back, {user.fullName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Free Trial Active & Granted Banner */}
        {hasActiveSubscription && whatsappAccessGranted && isTrial && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                  Your 2-Day Free Trial is Active!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  You are added to the WhatsApp signal group ({subscription ? getTimeRemaining(subscription.currentPeriodEnd) : "48h"}). 
                  Upgrade anytime to keep uninterrupted signal access.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowUpgradeSection(!showUpgradeSection)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 mr-1" />
              {showUpgradeSection ? "Hide Plans" : "Upgrade Plan"}
            </Button>
          </div>
        )}

        {/* Pending Group Addition Banner */}
        {hasActiveSubscription && !whatsappAccessGranted && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4 rounded-xl mb-8 flex items-start gap-3 shadow-sm animate-in fade-in">
            <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-base">
                {isTrial ? "Trial Request Submitted – Being Added to Group" : "Payment Confirmed – Being Added to Group"}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                The admin is reviewing your account and will add your registered phone number (<strong>{user.phone}</strong>) to the private WhatsApp signal group within a few hours.
                {isTrial && " Your 48-hour trial timer will begin as soon as you are added."}
              </p>
            </div>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Account Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Account Status
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2 mt-1">
                {user.isActive ? (
                  <span className="text-emerald-500 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                  </span>
                ) : (
                  <span className="text-muted-foreground">Inactive</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center mt-2">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Role: {user.role === "ADMIN_PROVIDER" ? "Admin Provider" : "Subscriber"}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Subscription Plan */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Subscription Plan
              </CardDescription>
              <CardTitle className="text-2xl font-bold mt-1">
                {hasActiveSubscription ? (
                  isTrial ? (
                    <span className="text-emerald-500 font-bold">2-Day Free Trial</span>
                  ) : isYearly ? (
                    <span className="text-primary font-bold">Yearly VIP Pass</span>
                  ) : (
                    <span className="text-primary font-bold">Monthly Pass</span>
                  )
                ) : (
                  <span className="text-muted-foreground font-normal text-xl">No Active Plan</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasActiveSubscription && subscription ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {whatsappAccessGranted ? (
                    <>
                      <p className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Valid until: {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ⏳ {getTimeRemaining(subscription.currentPeriodEnd)}
                      </p>
                    </>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      ⏳ Pending admin group addition (Timer starts once added)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Choose a free trial or paid plan below to request signal access.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card 3: WhatsApp Group Access */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                WhatsApp Group
              </CardDescription>
              <CardTitle className="text-2xl font-bold mt-1">
                {hasActiveSubscription && whatsappAccessGranted ? (
                  <span className="text-emerald-500 flex items-center gap-1.5 text-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Added to Group
                  </span>
                ) : hasActiveSubscription && !whatsappAccessGranted ? (
                  <span className="text-amber-500 text-lg">Adding Soon</span>
                ) : (
                  <span className="text-muted-foreground text-lg">Locked</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasActiveSubscription && whatsappAccessGranted ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Signals active on {user.phone}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Admin dispatches live calls directly to group.</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  {hasActiveSubscription 
                    ? `Admin will add your number (${user.phone}) to the private group shortly.`
                    : "Activate trial or subscription to get added by admin."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pricing / Plan Selection Section */}
        {(!hasActiveSubscription || showUpgradeSection) && (
          <div className="mb-8 p-6 rounded-2xl border bg-card/60 backdrop-blur shadow-sm">
            <div className="text-center max-w-xl mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                <Crown className="w-3.5 h-3.5" />
                {hasActiveSubscription ? "Upgrade Your Membership" : "Get Instant Signal Access"}
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Choose Your Access Plan</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Start with a 2-day free trial or choose a monthly/yearly pass for uninterrupted SPX technical chart signals.
              </p>
            </div>

            <RazorpayCheckout 
              hasUsedTrial={user.hasUsedTrial}
              onSuccess={() => {
                setShowUpgradeSection(false);
                router.refresh();
              }}
            />
          </div>
        )}

        {/* Account Details Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Account Profile</CardTitle>
            <CardDescription className="text-xs">
              Your registered user details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg border">
                <p className="text-muted-foreground font-medium">Full Name</p>
                <p className="font-bold text-sm mt-0.5">{user.fullName}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border">
                <p className="text-muted-foreground font-medium">Email Address</p>
                <p className="font-bold text-sm mt-0.5 truncate" title={user.email}>{user.email}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border">
                <p className="text-muted-foreground font-medium">Phone (WhatsApp)</p>
                <p className="font-bold text-sm mt-0.5">{user.phone}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border">
                <p className="text-muted-foreground font-medium">Trial Eligibility</p>
                <p className="font-bold text-sm mt-0.5">
                  {user.hasUsedTrial ? (
                    <span className="text-muted-foreground">Claimed</span>
                  ) : (
                    <span className="text-emerald-500">Available (₹0)</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

