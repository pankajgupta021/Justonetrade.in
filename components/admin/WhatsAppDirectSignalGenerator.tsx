"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Radio,
  Zap,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  Check,
  PowerOff,
  ChevronDown,
  LogOut
} from "lucide-react";

interface WhatsAppGroup {
  id: string;
  name: string;
  participantsCount?: number;
}

export function WhatsAppDirectSignalGenerator() {
  const [manualStrike, setManualStrike] = useState<number>(7700);
  const [step, setStep] = useState<number>(10);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);

  const [waStatus, setWaStatus] = useState<"disconnected" | "connecting" | "qr_ready" | "connected">("disconnected");
  const [qrCodeImg, setQrCodeImg] = useState<string | null>(null);
  const [connectedNumber, setConnectedNumber] = useState<string | undefined>(undefined);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const [statusFeedback, setStatusFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Tracks whether we have a live QR being displayed so transient "disconnected"
  // responses from cold Vercel instances don't blank it out.
  const hasActiveQrRef = useRef<boolean>(false);

  const roundToNearestStep = (value: number, stepValue: number) => {
    return Math.round(value / stepValue) * stepValue;
  };

  const baseStrike = isAutoSync && livePrice !== null
    ? roundToNearestStep(livePrice, step)
    : manualStrike;

  const showFeedback = (message: string, type: "success" | "error" | "info" = "success") => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setStatusFeedback({ message, type });
    feedbackTimeoutRef.current = setTimeout(() => {
      setStatusFeedback(null);
    }, 4000);
  };

  const checkWhatsAppStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/status", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        // If a cold Vercel instance returns "disconnected" but we are currently
        // showing a QR, trust our local state — don't blank the QR.
        if (data.status === "disconnected" && hasActiveQrRef.current) {
          return;
        }

        setWaStatus(data.status);
        setQrCodeImg(data.qrCode ?? null);
        setConnectedNumber(data.connectedNumber);

        // Update our ref to track whether a QR is currently visible
        hasActiveQrRef.current = data.status === "qr_ready" && !!data.qrCode;

        if (data.status === "connected") {
          hasActiveQrRef.current = false;
          setShowQrModal(false);
        }

        if (data.groups && data.groups.length > 0) {
          setGroups(data.groups);
          if (!selectedGroupId) {
            const saved = typeof window !== "undefined" ? localStorage.getItem("selected_whatsapp_group") : null;
            if (saved && data.groups.some((g: WhatsAppGroup) => g.id === saved)) {
              setSelectedGroupId(saved);
            } else {
              setSelectedGroupId(data.groups[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error checking WhatsApp status:", err);
    }
  }, [selectedGroupId]);

  const handleConnectWhatsApp = async (forceNew = false) => {
    try {
      setShowQrModal(true);
      setWaStatus("connecting");
      if (forceNew) {
        // Only clear on explicit refresh so the old QR stays while we generate a new one
        setQrCodeImg(null);
        hasActiveQrRef.current = false;
      }
      const res = await fetch("/api/admin/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceNew }),
      });
      const data = await res.json();
      if (data.success) {
        setWaStatus(data.status);
        if (data.qrCode) {
          setQrCodeImg(data.qrCode);
          hasActiveQrRef.current = true;
        }
        if (data.status === "connected") {
          hasActiveQrRef.current = false;
          setShowQrModal(false);
          showFeedback("WhatsApp Bot linked successfully!", "success");
        }
      }
    } catch (err) {
      console.error("Failed to connect WhatsApp:", err);
      showFeedback("Failed to initialize WhatsApp connection", "error");
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await fetch("/api/admin/whatsapp/disconnect", { method: "POST" });
      setWaStatus("disconnected");
      setQrCodeImg(null);
      hasActiveQrRef.current = false;
      setConnectedNumber(undefined);
      setGroups([]);
      setSelectedGroupId("");
      showFeedback("WhatsApp disconnected successfully", "info");
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const handleRefreshGroups = async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/groups");
      const data = await res.json();
      if (data.success && data.groups) {
        setGroups(data.groups);
        showFeedback(`Refreshed ${data.groups.length} WhatsApp groups`, "info");
      }
    } catch (err) {
      console.error("Failed to refresh groups:", err);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_whatsapp_group", groupId);
    }
  };

  const fetchPrice = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoadingPrice(true);
    try {
      const res = await fetch("/api/admin/spx-price", { cache: "no-store" });
      const data = await res.json();
      if (data.price) {
        setLivePrice(data.price);
      }
    } catch (error) {
      console.error("Failed to fetch SPX price:", error);
    } finally {
      if (showLoading) setIsLoadingPrice(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      try {
        const [priceRes, statusRes] = await Promise.allSettled([
          fetch("/api/admin/spx-price", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/admin/whatsapp/status").then((r) => r.json()),
        ]);

        if (isMounted) {
          if (priceRes.status === "fulfilled" && priceRes.value?.price) {
            setLivePrice(priceRes.value.price);
          }
          if (statusRes.status === "fulfilled" && statusRes.value?.success) {
            const data = statusRes.value;
            setWaStatus(data.status);
            setQrCodeImg(data.qrCode ?? null);
            setConnectedNumber(data.connectedNumber);
            hasActiveQrRef.current = data.status === "qr_ready" && !!data.qrCode;
            if (data.groups && data.groups.length > 0) {
              setGroups(data.groups);
              if (!selectedGroupId) {
                const saved = typeof window !== "undefined" ? localStorage.getItem("selected_whatsapp_group") : null;
                if (saved && data.groups.some((g: WhatsAppGroup) => g.id === saved)) {
                  setSelectedGroupId(saved);
                } else {
                  setSelectedGroupId(data.groups[0].id);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error during initial poll:", err);
      }
    };

    initialLoad();

    const priceInterval = setInterval(() => fetchPrice(false), 5000);
    const statusInterval = setInterval(checkWhatsAppStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(priceInterval);
      clearInterval(statusInterval);
    };
  }, [fetchPrice, checkWhatsAppStatus, selectedGroupId]);


  const buildQuickSignalMessage = (action: "B" | "S", type: "Call" | "Put", strike: number) => {
    const actionWord = action === "B" ? "Buy" : "Sell";
    const typeWord = type.toLowerCase();
    return `${actionWord} spx ${strike} ${typeWord}`;
  };

  const buildExitSignalMessage = () => {
    return `Exit spx`;
  };

  const handleDirectSendSignal = async (message: string) => {
    if (waStatus !== "connected") {
      showFeedback("WhatsApp Bot is not connected! Click 'Connect WhatsApp' to link.", "error");
      setShowQrModal(true);
      return;
    }

    if (!selectedGroupId) {
      showFeedback("Please select a target WhatsApp Group from the dropdown.", "error");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const groupName = groups.find((g) => g.id === selectedGroupId)?.name || "WhatsApp Group";
        showFeedback(`⚡ Sent: "${message}" to ${groupName}!`, "success");
      } else {
        showFeedback(data.error || "Failed to post signal", "error");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send message";
      console.error("Failed to dispatch signal:", err);
      showFeedback(errMsg, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyOnly = async (message: string, id: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(id);
      showFeedback(`📋 Copied: "${message}"`, "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const callStrikes = [
    baseStrike + step * 3,
    baseStrike + step * 2,
    baseStrike + step * 1,
    baseStrike,
  ];

  const putStrikes = [
    baseStrike,
    baseStrike - step * 1,
    baseStrike - step * 2,
    baseStrike - step * 3,
  ];

  const exitMessage = buildExitSignalMessage();

  return (
    <Card className="flex flex-col border-primary/20 shadow-xl w-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
            <CardTitle className="text-base font-bold">1-Click Direct WhatsApp Signals</CardTitle>
          </div>

          {/* WhatsApp Connection Badge */}
          {waStatus === "connected" ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Linked {connectedNumber ? `(+${connectedNumber})` : ""}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDisconnectWhatsApp}
                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                title="Disconnect WhatsApp Session"
              >
                <PowerOff className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConnectWhatsApp(false)}
              className="h-7 text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20 font-semibold"
            >
              <QrCode className="w-3.5 h-3.5 mr-1" />
              Connect WhatsApp Bot
            </Button>
          )}
        </div>

        {/* Group Selector Dropdown */}
        {waStatus === "connected" ? (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-medium">
              <Users className="w-3.5 h-3.5 text-primary" /> Target Group:
            </div>
            <div className="relative flex-1">
              <select
                value={selectedGroupId}
                onChange={(e) => handleSelectGroup(e.target.value)}
                className="w-full h-8 text-xs font-semibold bg-background border rounded-md px-2.5 pr-7 appearance-none focus:outline-none focus:ring-1 focus:ring-primary truncate"
              >
                {groups.length === 0 ? (
                  <option value="">No participating groups found</option>
                ) : (
                  groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.participantsCount ? `(${g.participantsCount} members)` : ""}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none opacity-60" />
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleRefreshGroups}
              className="h-8 w-8 shrink-0 text-muted-foreground"
              title="Refresh groups list"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <CardDescription className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-1">
            ⚠️ Scan QR code once to link your WhatsApp and post signals directly to your subscribers group.
          </CardDescription>
        )}

        {/* Dynamic Feedback Banner */}
        {statusFeedback && (
          <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-md border animate-in fade-in slide-in-from-top-1 duration-200 mt-2 ${statusFeedback.type === "success"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            : statusFeedback.type === "error"
              ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
              : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
            }`}>
            <div className="flex items-center gap-1.5">
              {statusFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              )}
              <span className="font-semibold">{statusFeedback.message}</span>
            </div>
            <button
              onClick={() => setStatusFeedback(null)}
              className="opacity-70 hover:opacity-100 ml-2 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3.5 flex flex-col gap-3">
        {/* 1. CALL STRIKES (TOP) */}
        <div className="bg-blue-500/5 p-2 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between px-2 pb-1 mb-1 border-b border-blue-500/10 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <span>CALL STRIKES (BUY / SELL)</span>
            <span>1-CLICK DISPATCH</span>
          </div>
          <div className="space-y-1">
            {callStrikes.map((strike, i) => {
              const buyMsg = buildQuickSignalMessage("B", "Call", strike);
              const sellMsg = buildQuickSignalMessage("S", "Call", strike);
              const rowId = `call-${strike}-${i}`;

              return (
                <div key={rowId} className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <span className="font-mono font-bold text-base text-foreground/90 w-16">{strike}</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleDirectSendSignal(buyMsg)}
                      disabled={isSending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-11 h-7 text-xs font-bold shadow-sm"
                      title={`Send: "${buyMsg}"`}
                    >
                      B
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDirectSendSignal(sellMsg)}
                      disabled={isSending}
                      className="bg-red-600 hover:bg-red-700 text-white w-11 h-7 text-xs font-bold shadow-sm"
                      title={`Send: "${sellMsg}"`}
                    >
                      S
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyOnly(buyMsg, `${rowId}-copy`)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Copy text"
                    >
                      {copiedId === `${rowId}-copy` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border bg-muted/40 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background rounded-md border text-xs font-bold shrink-0">
              <Radio className={`h-3.5 w-3.5 ${isAutoSync ? "text-emerald-500 animate-pulse" : "text-muted-foreground"}`} />
              <span className="text-muted-foreground text-[11px]">SPX:</span>
              <span className="text-foreground">
                {livePrice ? `$${livePrice.toFixed(2)}` : "..."}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchPrice(true)}
                disabled={isLoadingPrice}
                className="h-5 w-5 text-muted-foreground hover:text-foreground ml-0.5 p-0"
                title="Refresh Live SPX Price"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingPrice ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Round Off Input */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap">Round:</span>
              <Input
                type="number"
                value={baseStrike}
                onChange={(e) => {
                  if (!isAutoSync) {
                    setManualStrike(Number(e.target.value));
                  }
                }}
                disabled={isAutoSync}
                className={`font-mono font-bold text-sm h-8 w-20 text-center px-1 ${isAutoSync
                  ? "bg-background border-border cursor-not-allowed font-extrabold text-primary"
                  : "bg-primary/10 border-primary/40"
                  }`}
                title="Base / Round Off Strike"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap">Step:</span>
              <Input
                type="number"
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                className="font-mono font-bold text-xs h-8 w-14 text-center px-1 bg-background border-border"
                title="Strike Step (e.g. 10)"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoSync(!isAutoSync)}
              className={`h-8 text-[11px] font-bold px-2 ${isAutoSync
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-background text-muted-foreground"
                }`}
            >
              {isAutoSync ? "Auto ON" : "Manual"}
            </Button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              onClick={() => handleDirectSendSignal(exitMessage)}
              disabled={isSending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-8 px-3 text-xs shadow-md border border-red-500 transition-transform active:scale-[0.98]"
              title={`Send: "${exitMessage}"`}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              EXIT SPX
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopyOnly(exitMessage, "exit-copy")}
              className="h-8 w-8 border-border text-muted-foreground hover:text-foreground shrink-0"
              title="Copy Exit Signal"
            >
              {copiedId === "exit-copy" ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-orange-500/5 p-2 rounded-lg border border-orange-500/20">
          <div className="flex items-center justify-between px-2 pb-1 mb-1 border-b border-orange-500/10 text-[11px] font-bold text-orange-600 dark:text-orange-400">
            <span>PUT STRIKES (BUY / SELL)</span>
            <span>1-CLICK DISPATCH</span>
          </div>
          <div className="space-y-1">
            {putStrikes.map((strike, i) => {
              const buyMsg = buildQuickSignalMessage("B", "Put", strike);
              const sellMsg = buildQuickSignalMessage("S", "Put", strike);
              const rowId = `put-${strike}-${i}`;

              return (
                <div key={rowId} className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <span className="font-mono font-bold text-base text-foreground/90 w-16">{strike}</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleDirectSendSignal(buyMsg)}
                      disabled={isSending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-11 h-7 text-xs font-bold shadow-sm"
                      title={`Send: "${buyMsg}"`}
                    >
                      B
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDirectSendSignal(sellMsg)}
                      disabled={isSending}
                      className="bg-red-600 hover:bg-red-700 text-white w-11 h-7 text-xs font-bold shadow-sm"
                      title={`Send: "${sellMsg}"`}
                    >
                      S
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyOnly(buyMsg, `${rowId}-copy`)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Copy text"
                    >
                      {copiedId === `${rowId}-copy` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showQrModal && waStatus !== "connected" && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-sm w-full border-primary/30 shadow-2xl p-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full border-b pb-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <QrCode className="w-4 h-4 text-primary" /> Scan WhatsApp QR
                </div>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {qrCodeImg ? (
                <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-lg border shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeImg} alt="Scan WhatsApp QR" className="w-56 h-56" />
                  <span className="text-[11px] text-slate-700 font-medium animate-pulse">
                    Scan with WhatsApp on phone to link
                  </span>
                </div>
              ) : (
                <div className="h-56 w-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Generating QR code...</span>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground text-center space-y-1">
                <p>1. Open WhatsApp on your phone</p>
                <p>2. Go to <strong>Settings &gt; Linked Devices</strong></p>
                <p>3. Tap <strong>Link a Device</strong> and point your camera here</p>
              </div>

              <div className="flex gap-2 w-full mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnectWhatsApp(true)}
                  className="flex-1 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh QR
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 text-xs"
                >
                  Done
                </Button>
              </div>
            </Card>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
