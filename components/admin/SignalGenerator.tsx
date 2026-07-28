"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TradingViewChart } from "@/components/admin/TradingViewChart";

export function SignalGenerator() {
  const [baseStrike, setBaseStrike] = useState<number>(5400);
  const [step, setStep] = useState<number>(10);

  const sendQuickSignal = (action: "B" | "S", type: "Call" | "Put", strike: number) => {
    const actionText = action === "B" ? "BUY" : "SELL";
    const emoji = action === "B" ? "🟢" : "🔴";
    const message = `🚨 *QUICK SIGNAL ALERT* 🚨\n\n${emoji} *Action:* ${actionText}\n📈 *Symbol:* SPX\n🎯 *Strike:* ${strike}\n⚡ *Type:* ${type}\n\n_Execute trade immediately._`;
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
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">ATM:</span>
            <Input 
              type="number" 
              value={baseStrike} 
              onChange={(e) => setBaseStrike(Number(e.target.value))}
              className="font-bold text-lg h-9 w-24 bg-primary/10 border-primary/30 text-center"
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

        {/* MIDDLE: LIVE SPX VALUE */}
        <div className="w-full">
          <TradingViewChart />
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
