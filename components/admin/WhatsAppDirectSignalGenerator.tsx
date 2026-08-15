"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Radio, 
  LogOut, 
  Zap, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Copy, 
  Check, 
  PowerOff,
  ChevronDown
} from "lucide-react";

interface WhatsAppGroup {
  id: string;
  name: string;
  participantsCount?: number;
}

export function WhatsAppDirectSignalGenerator() {
  // SPX & Strike States
  const [manualStrike, setManualStrike] = useState<number>(5400);
  const [step, setStep] = useState<number>(10);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);

  // WhatsApp Bot States
  const [waStatus, setWaStatus] = useState<"disconnected" | "connecting" | "qr_ready" | "connected">("disconnected");
  const [qrCodeImg, setQrCodeImg] = useState<string | null>(null);
  const [connectedNumber, setConnectedNumber] = useState<string | undefined>(undefined);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Feedback & Copy States
  const [statusFeedback, setStatusFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to round to nearest step
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
    }, 5000);
  };

  // Check WhatsApp Bot status
  const checkWhatsAppStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/status");
      const data = await res.json();
      if (data.success) {
        setWaStatus(data.status);
        setQrCodeImg(data.qrCode);
        setConnectedNumber(data.connectedNumber);
        if (data.groups && data.groups.length > 0) {
          setGroups(data.groups);
          if (!selectedGroupId) {
            // Restore from localStorage or default to first group
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

  // Connect WhatsApp session
  const handleConnectWhatsApp = async () => {
    try {
      setShowQrModal(true);
      setWaStatus("connecting");
      const res = await fetch("/api/admin/whatsapp/connect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWaStatus(data.status);
        setQrCodeImg(data.qrCode);
      }
    } catch (err) {
      console.error("Failed to connect WhatsApp:", err);
      showFeedback("Failed to initialize WhatsApp connection", "error");
    }
  };

  // Disconnect WhatsApp session
  const handleDisconnectWhatsApp = async () => {
    try {
      await fetch("/api/admin/whatsapp/disconnect", { method: "POST" });
      setWaStatus("disconnected");
      setQrCodeImg(null);
      setConnectedNumber(undefined);
      setGroups([]);
      setSelectedGroupId("");
      showFeedback("WhatsApp disconnected successfully", "info");
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  // Fetch groups
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

  // Set selected group and save to localStorage
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_whatsapp_group", groupId);
    }
  };

  // Poll price & WhatsApp status
  useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const res = await fetch("/api/admin/spx-price");
        const data = await res.json();
        if (isMounted && data.price) {
          setLivePrice(data.price);
        }
      } catch (error) {
        console.error("Failed to fetch SPX price:", error);
      } finally {
        if (isMounted) {
          setIsLoadingPrice(false);
        }
      }
    };

    const runPolls = async () => {
      await fetchPrice();
      await checkWhatsAppStatus();
    };

    runPolls();

    const priceInterval = setInterval(fetchPrice, 15000);
    const statusInterval = setInterval(checkWhatsAppStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(priceInterval);
      clearInterval(statusInterval);
    };
  }, [checkWhatsAppStatus]);

  const handleManualPriceRefresh = async () => {
    setIsLoadingPrice(true);
    try {
      const res = await fetch("/api/admin/spx-price");
      const data = await res.json();
      if (data.price) {
        setLivePrice(data.price);
      }
    } catch (error) {
      console.error("Failed to fetch live SPX price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const buildQuickSignalMessage = (action: "B" | "S", type: "Call" | "Put", strike: number) => {
    const actionText = action === "B" ? "BUY" : "SELL";
    const emoji = action === "B" ? "🟢" : "🔴";
    return `📚 *TECHNICAL ANALYSIS CHART INSIGHT* 📚\n\n${emoji} *Action:* ${actionText}\n📈 *Symbol:* SPX\n🎯 *Strike:* ${strike}\n⚡ *Type:* ${type}\n\n_Educational study only. Practice analyzing this chart setup._`;
  };

  const buildExitSignalMessage = () => {
    return `📚 *TECHNICAL ANALYSIS CHART INSIGHT* 📚\n\n🚨 *Action:* EXIT ALL POSITIONS\n📈 *Symbol:* SPX\n\n_Educational study only. Practice analyzing this chart setup._`;
  };

  // Direct 1-Click Send into WhatsApp Group
  const handleDirectSendSignal = async (message: string) => {
    if (waStatus !== "connected") {
      showFeedback("WhatsApp Bot is not connected! Click 'Connect WhatsApp' to link.", "error");
      setShowQrModal(true);
      return;
    }

    if (!selectedGroupId) {
      showFeedback("Please select a target WhatsApp Group from the dropdown above.", "error");
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
        showFeedback(`⚡ Posted directly into "${groupName}"!`, "success");
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
      showFeedback("📋 Message copied to clipboard!", "success");
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

  return (
    <Card className="flex flex-col border-primary/20 shadow-xl max-w-xl mx-auto w-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
            <CardTitle className="text-base font-bold">1-Click Direct WhatsApp Signals</CardTitle>
          </div>
          
          {/* WhatsApp Connection Badge */}
          {waStatus === "connected" ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 px-2 py-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Bot Linked {connectedNumber ? `(+${connectedNumber})` : ""}
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
              onClick={handleConnectWhatsApp}
              className="h-7 text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
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
            ⚠️ Scan the QR code once to enable instant 1-click posting directly to your WhatsApp subscribers group.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-3">
        {/* SPX Price & Controls Bar */}
        <div className="flex flex-col gap-2 border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className={`h-4 w-4 ${isAutoSync ? "text-green-500 animate-pulse" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold text-muted-foreground">
                {livePrice ? `Live SPX: $${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Fetching live SPX..."}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleManualPriceRefresh} 
                disabled={isLoadingPrice}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Refresh Live SPX"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPrice ? "animate-spin" : ""}`} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAutoSync(!isAutoSync)}
                className={`h-7 text-xs font-semibold px-2 ${isAutoSync ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 hover:text-green-700" : ""}`}
              >
                {isAutoSync ? "Auto-Sync ON" : "Manual Mode"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Round Off SPX:</span>
              <Input 
                type="number" 
                value={baseStrike} 
                onChange={(e) => {
                  if (!isAutoSync) {
                    setManualStrike(Number(e.target.value));
                  }
                }}
                disabled={isAutoSync}
                className={`font-bold text-lg h-9 w-full text-center ${isAutoSync ? "bg-muted cursor-not-allowed opacity-90 border-none" : "bg-primary/10 border-primary/30"}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">Step:</span>
              <Input 
                type="number" 
                value={step} 
                onChange={(e) => setStep(Number(e.target.value))}
                className="font-bold text-sm h-9 w-16 text-center"
              />
            </div>
          </div>

          {/* Dynamic Feedback Banner */}
          {statusFeedback && (
            <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-md border animate-in fade-in slide-in-from-top-1 duration-200 mt-1 ${
              statusFeedback.type === "success" 
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
        </div>

        {/* CALL SECTION */}
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
                <div key={rowId} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <span className="font-mono font-bold text-base text-foreground/80 w-16">{strike}</span>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      size="sm" 
                      onClick={() => handleDirectSendSignal(buyMsg)} 
                      disabled={isSending}
                      className="bg-green-600 hover:bg-green-700 text-white w-12 h-7 text-xs font-bold shadow-sm"
                      title="Post BUY Call directly to WhatsApp Group"
                    >
                      B
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDirectSendSignal(sellMsg)} 
                      disabled={isSending}
                      className="bg-red-600 hover:bg-red-700 text-white w-12 h-7 text-xs font-bold shadow-sm"
                      title="Post SELL Call directly to WhatsApp Group"
                    >
                      S
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyOnly(buyMsg, `${rowId}-copy`)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Copy text only"
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

        {/* MIDDLE: EXIT ALL POSITIONS BUTTON */}
        <div className="w-full my-1">
          <div className="flex gap-1.5 items-center">
            <Button 
              onClick={() => handleDirectSendSignal(buildExitSignalMessage())} 
              disabled={isSending}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold h-10 shadow-md border border-slate-700 transition-transform active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              EXIT ALL POSITIONS (DIRECT TO GROUP)
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopyOnly(buildExitSignalMessage(), "exit-copy")}
              className="h-10 w-10 border-slate-700 text-muted-foreground hover:text-foreground shrink-0"
              title="Copy Exit Signal"
            >
              {copiedId === "exit-copy" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* PUT SECTION */}
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
                <div key={rowId} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <span className="font-mono font-bold text-base text-foreground/80 w-16">{strike}</span>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      size="sm" 
                      onClick={() => handleDirectSendSignal(buyMsg)} 
                      disabled={isSending}
                      className="bg-green-600 hover:bg-green-700 text-white w-12 h-7 text-xs font-bold shadow-sm"
                      title="Post BUY Put directly to WhatsApp Group"
                    >
                      B
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDirectSendSignal(sellMsg)} 
                      disabled={isSending}
                      className="bg-red-600 hover:bg-red-700 text-white w-12 h-7 text-xs font-bold shadow-sm"
                      title="Post SELL Put directly to WhatsApp Group"
                    >
                      S
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyOnly(buyMsg, `${rowId}-copy`)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Copy text only"
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

        {/* QR Code Modal / Card Overlay */}
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
                  onClick={handleConnectWhatsApp}
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
