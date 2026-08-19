"use client";

import { useEffect, useRef, useState, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock } from "lucide-react";

export type ChartTimeframe = "5" | "15" | "30" | "60" | "120" | "180" | "240" | "D";

interface TechnicalStudyChartProps {
  defaultTimeframe?: ChartTimeframe;
  height?: number | string;
  className?: string;
  showTimeframeBar?: boolean;
}

const timeframes: { label: string; value: ChartTimeframe; tooltip: string }[] = [
  { label: "5m", value: "5", tooltip: "5 Minutes" },
  { label: "15m", value: "15", tooltip: "15 Minutes" },
  { label: "30m", value: "30", tooltip: "30 Minutes" },
  { label: "1h", value: "60", tooltip: "1 Hour" },
  { label: "2h", value: "120", tooltip: "2 Hours" },
  { label: "3h", value: "180", tooltip: "3 Hours" },
  { label: "4h", value: "240", tooltip: "4 Hours" },
  { label: "1D", value: "D", tooltip: "1 Day" },
];

function TechnicalStudyChartComponent({
  defaultTimeframe = "5",
  height = 560,
  className = "",
  showTimeframeBar = true,
}: TechnicalStudyChartProps) {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(defaultTimeframe);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetSlot = document.createElement("div");
    widgetSlot.className = "tradingview-widget-container__widget";
    widgetSlot.style.height = "100%";
    widgetSlot.style.width = "100%";
    widgetContainer.appendChild(widgetSlot);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    // CME_MINI:ES1! = S&P 500 E-mini Continuous Futures (trades 24/5, matches SPX options pricing)
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "CME_MINI:ES1!",
      interval: timeframe,
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      save_image: false,
      calendar: false,
      studies: [
        "STD;RSI",
        "STD;EMA"
      ],
      support_host: "https://www.tradingview.com",
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      container.innerHTML = "";
    };
  }, [timeframe]);

  return (
    <div className={`flex flex-col w-full rounded-xl overflow-hidden border border-border bg-card shadow-lg ${className}`}>
      {showTimeframeBar && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground tracking-tight">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>S&P 500 (SPX)</span>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Study
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Timeframe:</span>
            </div>
            <div className="flex items-center bg-background/80 p-0.5 rounded-lg border border-border/80">
              {timeframes.map((tf) => {
                const isActive = timeframe === tf.value;
                return (
                  <Button
                    key={tf.value}
                    size="sm"
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => setTimeframe(tf.value)}
                    className={`h-7 px-2.5 text-xs font-bold transition-all ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    title={tf.tooltip}
                  >
                    {tf.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Chart Canvas */}
      <div
        ref={containerRef}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        className="w-full relative min-h-[420px] bg-slate-950"
      />
    </div>
  );
}

export const TechnicalStudyChart = memo(TechnicalStudyChartComponent);
