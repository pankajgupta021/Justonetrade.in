"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, MessageCircle, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";

interface DashboardUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}

export function DashboardContent({ 
  user, 
  hasActiveSubscription, 
  whatsappAccessGranted 
}: { 
  user: DashboardUser, 
  hasActiveSubscription: boolean,
  whatsappAccessGranted: boolean 
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user.fullName}</p>
          </div>
          <Button className="cursor-pointer hover:bg-red-600" variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {hasActiveSubscription && !whatsappAccessGranted && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4 rounded-lg mb-8">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">Payment Received – Pending Verification</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Your payment was successful and your subscription is active! The Admin is currently reviewing your payment. 
              Once verified, your WhatsApp Premium access link will appear below.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                Account Status
              </CardDescription>
              <CardTitle className="text-2xl">{user.isActive ? "Active" : "Inactive"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center mt-4">
                <Clock className="mr-2 h-4 w-4" />
                Role: {user.role === "ADMIN_PROVIDER" ? "Admin" : "Subscriber"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Subscription
              </CardDescription>
              <CardTitle className="text-2xl">
                {hasActiveSubscription ? (
                  <span className="text-green-500">Paid</span>
                ) : (
                  "Not Active"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasActiveSubscription ? (
                <p className="text-sm text-muted-foreground mt-4">
                  Your 30-Day pass is active.
                </p>
              ) : (
                <div className="mt-4 flex flex-col items-start gap-4">
                  <p className="text-sm text-muted-foreground">
                    Subscribe to start receiving SPX Options signals.
                  </p>
                  <RazorpayCheckout />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                WhatsApp Access
              </CardDescription>
              <CardTitle className="text-2xl">
                {hasActiveSubscription && whatsappAccessGranted ? (
                  <span className="text-green-500">Granted</span>
                ) : hasActiveSubscription && !whatsappAccessGranted ? (
                  <span className="text-amber-500">Pending Admin</span>
                ) : (
                  "Locked"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mt-4">
                {hasActiveSubscription && whatsappAccessGranted 
                  ? "You have full access to our private WhatsApp group and signals." 
                  : hasActiveSubscription && !whatsappAccessGranted 
                  ? "Awaiting admin to grant group access."
                  : "Access will be granted after subscription activation."
                }
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Your registered information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Full Name</p>
                <p className="font-medium">{user.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Status</p>
                <p className="font-medium">{user.isActive ? "Active" : "Disabled"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
