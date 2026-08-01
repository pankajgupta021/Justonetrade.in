"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Radio, LogOut } from "lucide-react";

export function SignalGenerator() {
  const [baseStrike, setBaseStrike] = useState<number>(5400);
  const [step, setStep] = useState<number>(10);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);

  // Helper to round to nearest step
  const roundToNearestStep = (value: number, stepValue: number) => {
    return Math.round(value / stepValue) * stepValue;
  };

  const fetchLivePrice = async () => {
    setIsLoadingPrice(true);
    try {
      const res = await fetch("/api/admin/spx-price");
      const data = await res.json();
      if (data.price) {
        setLivePrice(data.price);
        if (isAutoSync) {
          setBaseStrike(roundToNearestStep(data.price, step));
        }
      }
    } catch (error) {
      console.error("Failed to fetch live SPX price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchLivePrice();
  }, []);

  // Poll for updates every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLivePrice();
    }, 15000);
    return () => clearInterval(interval);
  }, [isAutoSync, step]);

  // Adjust base strike if step changes while auto-sync is active
  useEffect(() => {
    if (livePrice && isAutoSync) {
      setBaseStrike(roundToNearestStep(livePrice, step));
    }
  }, [step, isAutoSync, livePrice]);

  const sendQuickSignal = (action: "B" | "S", type: "Call" | "Put", strike: number) => {
    const actionText = action === "B" ? "BUY" : "SELL";
    const emoji = action === "B" ? "🟢" : "🔴";
    const message = `📚 *TECHNICAL ANALYSIS CHART INSIGHT* 📚\n\n${emoji} *Action:* ${actionText}\n📈 *Symbol:* SPX\n🎯 *Strike:* ${strike}\n⚡ *Type:* ${type}\n\n_Educational study only. Practice analyzing this chart setup._`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const sendExitSignal = () => {
    const message = `📚 *TECHNICAL ANALYSIS CHART INSIGHT* 📚\n\n🚨 *Action:* EXIT ALL POSITIONS\n📈 *Symbol:* SPX\n\n_Educational study only. Practice analyzing this chart setup._`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
        
        {/* Settings Bar */}
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
                onClick={fetchLivePrice} 
                disabled={isLoadingPrice}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
              <span className="text-xs font-bold uppercase text-muted-foreground">ATM:</span>
              <Input 
                type="number" 
                value={baseStrike} 
                onChange={(e) => {
                  if (!isAutoSync) {
                    setBaseStrike(Number(e.target.value));
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
        </div>

        {/* CALL SECTION */}
        <div className="bg-blue-500/5 p-2 rounded-lg border border-blue-500/20">
          <div className="space-y-1">
            {callStrikes.map((strike, i) => (
              <div key={`call-${strike}-${i}`} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <span className="font-mono font-bold text-base text-foreground/80 w-16">{strike}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => sendQuickSignal("B", "Call", strike)} className="bg-green-600 hover:bg-green-700 w-10 h-7 text-xs font-bold">
                    B
                  </Button>
                  <Button size="sm" onClick={() => sendQuickSignal("S", "Call", strike)} className="bg-red-600 hover:bg-red-700 w-10 h-7 text-xs font-bold">
                    S
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE: EXIT ALL POSITIONS BUTTON */}
        <div className="w-full my-1">
          <Button 
            onClick={sendExitSignal} 
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-10 shadow-md border border-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            EXIT ALL POSITIONS
          </Button>
        </div>

        {/* PUT SECTION */}
        <div className="bg-orange-500/5 p-2 rounded-lg border border-orange-500/20">
          <div className="space-y-1">
            {putStrikes.map((strike, i) => (
              <div key={`put-${strike}-${i}`} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <span className="font-mono font-bold text-base text-foreground/80 w-16">{strike}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => sendQuickSignal("B", "Put", strike)} className="bg-green-600 hover:bg-green-700 w-10 h-7 text-xs font-bold">
                    B
                  </Button>
                  <Button size="sm" onClick={() => sendQuickSignal("S", "Put", strike)} className="bg-red-600 hover:bg-red-700 w-10 h-7 text-xs font-bold">
                    S
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
