"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CreditCard, Activity, ArrowUpRight, ArrowDownRight, RefreshCcw, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform metrics and SPX Options market status.
          </p>
        </div>
        <Button size="sm" variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,105</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹33.1L</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-red-500">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>SPX Market Data</CardTitle>
            <CardDescription>
              Real-time options data placeholder. (API Integration Required)
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full bg-muted/20 rounded-md border border-dashed flex items-center justify-center flex-col text-muted-foreground p-8 text-center">
              <LineChart className="h-10 w-10 mb-4 opacity-50" />
              <p className="font-medium text-foreground">Market Data Placeholder</p>
              <p className="text-sm mt-2 max-w-sm">
                Integrate with a financial data provider to display live SPX Price, Option Type, Strike Price, Expiry, and Option Price here.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Signals Sent</CardTitle>
            <CardDescription>
              Latest signals broadcasted to the WhatsApp group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { time: "10:15 AM", type: "BUY CALL", target: "5.50", sl: "3.20", status: "Active" },
                { time: "09:30 AM", type: "UPDATE", text: "Hold previous position, trail SL to 4.00", status: "Info" },
                { time: "Yesterday", type: "SELL PUT", target: "1.20", sl: "3.50", status: "Target Hit" },
              ].map((signal, i) => (
                <div key={i} className="flex items-start justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {signal.type === "UPDATE" ? signal.text : `${signal.type} SPX Option @ CMP`}
                    </p>
                    {signal.type !== "UPDATE" && (
                      <p className="text-sm text-muted-foreground">
                        Target: {signal.target} | SL: {signal.sl}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-muted-foreground">{signal.time}</div>
                    <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      signal.status === "Active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      signal.status === "Target Hit" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {signal.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
