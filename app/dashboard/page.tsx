"use client";

import { CheckCircle2, Calendar, CreditCard, MessageCircle, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function UserDashboardPage() {
  return (
    <div className="flex-1 flex flex-col py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, John Doe</p>
          </div>
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Subscription Status
              </CardDescription>
              <CardTitle className="text-2xl">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center mt-4">
                <Calendar className="mr-2 h-4 w-4" />
                Expires on Aug 24, 2026
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-500" />
                Payment Status
              </CardDescription>
              <CardTitle className="text-2xl">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mt-4">
                Last billed on Jul 24, 2026
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp Access
              </CardDescription>
              <CardTitle className="text-2xl">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mt-4">
                You are currently receiving signals.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              Update your payment methods, view invoices, or cancel your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline">Update Payment Method</Button>
              <Button variant="outline">View Billing History</Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:ml-auto">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
