"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";

type UserWithSub = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  subscriptions: {
    id: string;
    whatsappAccess: boolean;
    currentPeriodEnd: string;
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
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startWhatsAppVerification = async (subscriptionId: string) => {
    if (typeof window === "undefined") return;

    const userAgent = navigator.userAgent || "";
    const isLinux = /Linux/.test(userAgent) && !/Android/.test(userAgent);

    // Prefer a group invite link or admin number from env, fall back to web.whatsapp.com
    const groupInvite = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_INVITE;
    const adminNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const message = "Please verify me for access to the WhatsApp group.";

    const webUrl = groupInvite
      ? groupInvite
      : adminNumber
      ? `https://web.whatsapp.com/send?phone=${adminNumber}&text=${encodeURIComponent(
          message
        )}`
      : "https://web.whatsapp.com/";

    if (isLinux) {
      // Desktop Linux: open WhatsApp Web in a new tab
      window.open(webUrl, "_blank");
      const confirmed = window.confirm(
        "Opened WhatsApp Web. After completing verification, click OK to grant access."
      );
      if (confirmed) await handleGrantAccess(subscriptionId);
      return;
    }

    // Non-Linux: try app deep link first, fallback to web
    if (adminNumber) {
      const appUrl = `whatsapp://send?phone=${adminNumber}&text=${encodeURIComponent(
        message
      )}`;
      // attempt to open the native app; user agent will handle fallback
      try {
        window.location.href = appUrl;
      } catch (e) {
        window.open(webUrl, "_blank");
      }
    } else {
      window.open(webUrl, "_blank");
    }

    const confirmed = window.confirm(
      "Opened WhatsApp. After completing verification, click OK to grant access."
    );
    if (confirmed) await handleGrantAccess(subscriptionId);
  };

  const filteredUsers = users.filter((u) => {
    // Search match
    const searchMatch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);

    if (!searchMatch) return false;

    // Filter match
    const hasActiveSub = u.subscriptions.length > 0;
    const isPending = hasActiveSub && !u.subscriptions[0].whatsappAccess;
    const isGranted = hasActiveSub && u.subscriptions[0].whatsappAccess;

    if (filter === "PENDING") return isPending;
    if (filter === "GRANTED") return isGranted;
    if (filter === "UNPAID") return !hasActiveSub;

    return true; // ALL
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, or phone..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <Button variant={filter === "ALL" ? "default" : "outline"} onClick={() => setFilter("ALL")} size="sm">All</Button>
          <Button variant={filter === "PENDING" ? "default" : "outline"} onClick={() => setFilter("PENDING")} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none">Pending Verification</Button>
          <Button variant={filter === "GRANTED" ? "default" : "outline"} onClick={() => setFilter("GRANTED")} size="sm" className="bg-green-600 hover:bg-green-700 text-white border-none">Access Granted</Button>
          <Button variant={filter === "UNPAID" ? "default" : "outline"} onClick={() => setFilter("UNPAID")} size="sm">Unpaid</Button>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>WhatsApp Access</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No subscribers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const sub = user.subscriptions[0];
                const hasPaid = !!sub;

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
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Paid</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Unpaid</Badge>
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
                            <ShieldCheck className="mr-1 h-4 w-4" /> Pending Verification
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
                          onClick={() => startWhatsAppVerification(sub.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Verify & Grant Access
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
