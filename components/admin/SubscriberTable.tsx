"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Search, ShieldCheck, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

type UserWithSub = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  hasUsedTrial?: boolean;
  createdAt: string;
  subscriptions: {
    id: string;
    whatsappAccess: boolean;
    planType?: string;
    currentPeriodEnd: string;
    isRecurring: boolean;
  }[];
};

export function SubscriberTable({ users }: { users: UserWithSub[] }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleGrantAccess = async (subscriptionId: string) => {
    try {
      const res = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId })
      });
      if (res.ok) {
        alert("Access granted successfully! Subscriber countdown has started.");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to grant access.");
      }
    } catch (e) {
      console.error(e);
      alert("Error granting access.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchMatch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);

    if (!searchMatch) return false;

    const hasActiveSub = u.subscriptions.length > 0;
    const sub = u.subscriptions[0];
    const isPending = hasActiveSub && !sub.whatsappAccess;
    const isGranted = hasActiveSub && sub.whatsappAccess;
    const isRecurring = hasActiveSub && sub.isRecurring;
    const isTrial = hasActiveSub && sub.planType === "TRIAL";
    const isYearly = hasActiveSub && sub.planType === "YEARLY";

    if (filter === "PENDING") return isPending;
    if (filter === "GRANTED") return isGranted;
    if (filter === "UNPAID") return !hasActiveSub;
    if (filter === "TRIAL") return isTrial;
    if (filter === "YEARLY") return isYearly;
    if (filter === "MONTHLY") return hasActiveSub && (isRecurring || sub.planType === "MONTHLY");
    if (filter === "ONETIME") return hasActiveSub && !isRecurring && sub.planType !== "TRIAL";
    if (filter === "EXPIRING") {
      if (!hasActiveSub) return false;
      const end = new Date(sub.currentPeriodEnd);
      const now = new Date();
      const diffDays = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7 && diffDays > 0;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 bg-card p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, or phone..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <Button variant={filter === "ALL" ? "default" : "outline"} onClick={() => setFilter("ALL")} size="sm">All</Button>
            <Button variant={filter === "PENDING" ? "default" : "outline"} onClick={() => setFilter("PENDING")} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none">Pending Verify</Button>
            <Button variant={filter === "GRANTED" ? "default" : "outline"} onClick={() => setFilter("GRANTED")} size="sm" className="bg-green-600 hover:bg-green-700 text-white border-none">Granted</Button>
            <Button variant={filter === "TRIAL" ? "default" : "outline"} onClick={() => setFilter("TRIAL")} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">Free Trials</Button>
            <Button variant={filter === "UNPAID" ? "default" : "outline"} onClick={() => setFilter("UNPAID")} size="sm">Unpaid</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="text-sm font-semibold text-muted-foreground flex items-center mr-2">Filters:</div>
          <Button variant={filter === "MONTHLY" ? "default" : "secondary"} onClick={() => setFilter("MONTHLY")} size="sm">Monthly</Button>
          <Button variant={filter === "YEARLY" ? "default" : "secondary"} onClick={() => setFilter("YEARLY")} size="sm">Yearly VIP</Button>
          <Button variant={filter === "EXPIRING" ? "destructive" : "secondary"} onClick={() => setFilter("EXPIRING")} size="sm">Expiring Soon (≤ 7 days)</Button>
          {(filter !== "ALL" || search !== "") && (
            <Button variant="ghost" onClick={() => { setFilter("ALL"); setSearch(""); }} size="sm" className="text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/30">
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Plan Type</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>WhatsApp Access</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No subscribers found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const sub = user.subscriptions[0];
                const hasPaid = !!sub;

                let daysLeft = 0;
                let isExpiringSoon = false;
                if (hasPaid) {
                  const end = new Date(sub.currentPeriodEnd);
                  const now = new Date();
                  daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                }

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.email}</div>
                      <div className="text-sm">{user.phone}</div>
                    </TableCell>
                    <TableCell>
                      {hasPaid ? (
                        sub.planType === "TRIAL" ? (
                          <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-none font-bold">2-Day Trial</Badge>
                        ) : sub.planType === "YEARLY" ? (
                          <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-none font-bold">👑 Yearly VIP</Badge>
                        ) : sub.isRecurring ? (
                          <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-none">Monthly Auto</Badge>
                        ) : (
                          <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-none">30-Day Pass</Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasPaid ? (
                        <div className="flex flex-col">
                          <span className="text-sm">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                          {isExpiringSoon && (
                            <span className="text-xs text-red-500 font-bold flex items-center">
                              <Clock className="w-3 h-3 mr-1" /> {daysLeft} days left
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasPaid ? (
                        sub.whatsappAccess ? (
                          <div className="flex items-center text-green-600 text-sm font-medium">
                            <Check className="mr-1 h-4 w-4" /> Granted
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600 text-sm font-medium">
                            <ShieldCheck className="mr-1 h-4 w-4" /> Pending
                          </div>
                        )
                      ) : (
                        <div className="flex items-center text-muted-foreground text-sm">
                          <X className="mr-1 h-4 w-4" /> Locked
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasPaid && !sub.whatsappAccess && (
                        <Button
                          size="sm"
                          onClick={() => handleGrantAccess(sub.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Verify & Grant
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
