"use client";

/**
 * ARCHIVED / TRASH BACKUP
 * This is the previous Web WhatsApp Signal Generator.
 * Kept here safely for future reference or fallback.
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Radio, 
  LogOut, 
  Copy, 
  Check, 
  Users, 
  Share2, 
  CheckCircle2, 
  Info
} from "lucide-react";

function extractGroupInviteCode(inviteUrlOrCode?: string): string {
  if (!inviteUrlOrCode) return "";
  const cleaned = inviteUrlOrCode.trim().split("?")[0].replace(/\/+$/, "");
  const match = cleaned.match(/(?:chat\.whatsapp\.com\/(?:invite\/)?|web\.whatsapp\.com\/accept\?code=|^)([A-Za-z0-9_-]+)$/);
  return match ? match[1] : cleaned;
}

export function ArchivedSignalGenerator() {
  const rawInvite = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_INVITE || "";
  const groupInviteCode = extractGroupInviteCode(rawInvite);
  const hasGroupInvite = Boolean(groupInviteCode);

  const [manualStrike, setManualStrike] = useState<number>(5400);
  const [step, setStep] = useState<number>(10);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);

  const [sendMode, setSendMode] = useState<"group" | "share">(() => (hasGroupInvite ? "group" : "share"));
  const [statusFeedback, setStatusFeedback] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const roundToNearestStep = (value: number, stepValue: number) => {
    return Math.round(value / stepValue) * stepValue;
  };

  const baseStrike = isAutoSync && livePrice !== null 
    ? roundToNearestStep(livePrice, step) 
    : manualStrike;

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
        console.error("Failed to fetch live SPX price:", error);
      } finally {
        if (isMounted) {
          setIsLoadingPrice(false);
        }
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  const showFeedback = (message: string, type: "success" | "info" = "success") => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setStatusFeedback({ message, type });
    feedbackTimeoutRef.current = setTimeout(() => {
      setStatusFeedback(null);
    }, 4500);
  };

  const openWhatsAppWeb = (url: string) => {
    if (typeof window === "undefined") return;
    const tab = window.open(url, "whatsapp_admin_tab");
    if (tab) {
      tab.focus();
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

  const handleSendSignal = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
    } catch (err) {
      console.warn("Clipboard access denied or unavailable:", err);
    }

    if (sendMode === "group" && groupInviteCode) {
      const directGroupUrl = `https://web.whatsapp.com/accept?code=${encodeURIComponent(groupInviteCode)}`;
      openWhatsAppWeb(directGroupUrl);
      showFeedback("📋 Copied! WhatsApp Group opened — Press Ctrl+V & Enter to send", "success");
    } else {
      const shareUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      openWhatsAppWeb(shareUrl);
      showFeedback("🚀 Opened WhatsApp Web with prefilled message", "info");
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
    <Card className="flex flex-col border-primary/20 shadow-xl max-w-lg mx-auto w-full">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 border-b pb-3 mb-1">
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

          <div className="flex items-center justify-between bg-muted/40 p-1.5 px-2.5 rounded-md border border-border/50 text-xs mt-1">
            <div className="flex items-center gap-1.5">
              {hasGroupInvite ? (
                <Badge variant="outline" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1.5 py-0 h-5 flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" /> Group Linked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground px-1.5 py-0 h-5 flex items-center gap-1">
                  <Share2 className="w-2.5 h-2.5" /> Web Share
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Linux Web Mode (Single Tab)</span>
            </div>

            <div className="flex items-center gap-1">
              {hasGroupInvite && (
                <Button
                  size="sm"
                  variant={sendMode === "group" ? "secondary" : "ghost"}
                  onClick={() => setSendMode("group")}
                  className={`h-6 text-[11px] px-2 font-medium ${sendMode === "group" ? "bg-primary/15 text-primary hover:bg-primary/20" : "text-muted-foreground"}`}
                  title="Direct to WhatsApp Group with auto-clipboard (press Ctrl+V to send)"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Direct Group
                </Button>
              )}
              <Button
                size="sm"
                variant={sendMode === "share" ? "secondary" : "ghost"}
                onClick={() => setSendMode("share")}
                className={`h-6 text-[11px] px-2 font-medium ${sendMode === "share" ? "bg-primary/15 text-primary hover:bg-primary/20" : "text-muted-foreground"}`}
                title="Open WhatsApp Web prefill composer"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Prefill Share
              </Button>
            </div>
          </div>

          {statusFeedback && (
            <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md border animate-in fade-in slide-in-from-top-1 duration-200 ${
              statusFeedback.type === "success" 
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" 
                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
            }`}>
              <div className="flex items-center gap-1.5">
                {statusFeedback.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <Info className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                )}
                <span className="font-medium">{statusFeedback.message}</span>
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

        <div className="bg-blue-500/5 p-2 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between px-2 pb-1 mb-1 border-b border-blue-500/10 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <span>CALL STRIKES</span>
            <span>ACTIONS</span>
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
                      onClick={() => handleSendSignal(buyMsg)} 
                      className="bg-green-600 hover:bg-green-700 text-white w-10 h-7 text-xs font-bold shadow-sm"
                    >
                      B
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendSignal(sellMsg)} 
                      className="bg-red-600 hover:bg-red-700 text-white w-10 h-7 text-xs font-bold shadow-sm"
                    >
                      S
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyOnly(buyMsg, `${rowId}-copy`)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
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

        <div className="w-full my-1">
          <div className="flex gap-1.5 items-center">
            <Button 
              onClick={() => handleSendSignal(buildExitSignalMessage())} 
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold h-10 shadow-md border border-slate-700 transition-transform active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              EXIT ALL POSITIONS
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopyOnly(buildExitSignalMessage(), "exit-copy")}
              className="h-10 w-10 border-slate-700 text-muted-foreground hover:text-foreground shrink-0"
            >
              {copiedId === "exit-copy" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-orange-500/5 p-2 rounded-lg border border-orange-500/20">
          <div className="flex items-center justify-between px-2 pb-1 mb-1 border-b border-orange-500/10 text-[11px] font-bold text-orange-600 dark:text-orange-400">
            <span>PUT STRIKES</span>
            <span>ACTIONS</span>
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
                      onClick={() => handleSendSignal(buyMsg)} 
                      className="bg-green-600 hover:bg-green-700 text-white w-10 h-7 text-xs font-bold shadow-sm"
                    >
                      B
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendSignal(sellMsg)} 
                      className="bg-red-600 hover:bg-red-700 text-white w-10 h-7 text-xs font-bold shadow-sm"
                    >
                      S
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyOnly(buyMsg, `${rowId}-copy`)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
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

      </CardContent>
    </Card>
  );
}
