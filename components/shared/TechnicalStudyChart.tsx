"use client";

import { useEffect, useMemo, useState, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Loader2, RefreshCw } from "lucide-react";

export type ChartTimeframe = "5" | "15" | "30" | "60" | "120" | "180" | "240" | "D";

interface TechnicalStudyChartProps {
  defaultTimeframe?: ChartTimeframe;
  height?: number;
  className?: string;
  showTimeframeBar?: boolean;
}

const timeframes: { label: string; value: ChartTimeframe; tooltip: string }[] = [
  { label: "5M", value: "5", tooltip: "5 Minutes" },
  { label: "15M", value: "15", tooltip: "15 Minutes" },
  { label: "30M", value: "30", tooltip: "30 Minutes" },
  { label: "1H", value: "60", tooltip: "1 Hour" },
  { label: "2H", value: "120", tooltip: "2 Hours" },
  { label: "3H", value: "180", tooltip: "3 Hours" },
  { label: "4H", value: "240", tooltip: "4 Hours" },
  { label: "1D", value: "D", tooltip: "1 Day" },
];

type ChartPoint = {
  time: number;
  close: number;
};

type ChartResponse = {
  symbol: string;
  source: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  updatedAt: number;
  points: ChartPoint[];
};

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TechnicalStudyChartComponent({
  defaultTimeframe = "5",
  height = 400,
  className = "",
  showTimeframeBar = true,
}: TechnicalStudyChartProps) {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(defaultTimeframe);
  const [chartData, setChartData] = useState<ChartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchChartData = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/market/spcfd-chart?timeframe=${timeframe}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Chart data unavailable");
        }

        const data = (await res.json()) as ChartResponse;
        setChartData(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load SPCFD chart:", err);
          setError("Live chart data is unavailable right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchChartData();
    const intervalId = window.setInterval(fetchChartData, 30000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [timeframe]);

  const chart = useMemo(() => {
    const points = chartData?.points ?? [];
    if (points.length < 2) return null;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const isPositive = lastPoint.close >= firstPoint.close;
    const color = isPositive ? "rgb(16 185 129)" : "rgb(239 68 68)";
    const gradientId = isPositive ? "gradient-positive" : "gradient-negative";
    const min = Math.min(...points.map((p) => p.close));
    const max = Math.max(...points.map((p) => p.close));
    const range = max - min;
    const padding = range * 0.1;
    const paddedMin = min - padding;
    const paddedMax = max + padding;
    const paddedRange = paddedMax - paddedMin;

    const pathData = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * 100;
        const y = 100 - ((p.close - paddedMin) / paddedRange) * 100;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return { pathData, color, gradientId, min: paddedMin, max: paddedMax };
  }, [chartData]);

  return (
    <div className={`w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl ${className}`}>
      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-semibold tracking-wide text-sm">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>SPCFD</span>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Study
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {showTimeframeBar && (
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 overflow-x-auto scrollbar-none">
                {timeframes.map((tf) => {
                  const isActive = timeframe === tf.value;
                  return (
                    <Button
                      key={tf.value}
                      size="sm"
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => {
                        setIsLoading(true);
                        setTimeframe(tf.value);
                      }}
                      className={`h-7 px-2.5 text-xs font-bold transition-all ${isActive
                          ? "bg-slate-700 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                        }`}
                      title={tf.tooltip}
                    >
                      {tf.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Price display */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-3">
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-mono">
              {chartData ? formatPrice(chartData.price) : "---"}
            </div>
            <div
              className={`flex items-center gap-1 text-sm sm:text-base font-bold px-2 py-0.5 rounded-md ${!chartData?.change || chartData.change >= 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
                }`}
            >
              {chartData?.change ? (
                <>
                  <span>{chartData.change >= 0 ? "+" : ""}</span>
                  <span>{formatPrice(chartData.change)}</span>
                  <span className="opacity-75">({formatPrice(chartData.changePercent ?? 0)}%)</span>
                </>
              ) : (
                <span>---</span>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {chartData ? `${chartData.source} data · Updated ${new Date(chartData.updatedAt).toLocaleTimeString()}` : "Loading Yahoo Finance data"}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <RefreshCw className="h-4 w-4 text-emerald-400" />
            )}
            <span>Refreshes every 30s</span>
          </div>
        </div>

        {/* Chart Area */}
        <div
          className="relative w-full mt-4 bg-slate-950/30 rounded-xl border border-slate-800/50"
          style={{ height: `${height}px` }}
        >
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <Activity className="h-8 w-8 mb-2 opacity-50 text-red-400" />
              <p className="text-sm font-medium text-red-400/80">{error}</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setTimeframe(timeframe)}
                className="text-emerald-500 mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : !chart ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-500/50 animate-spin" />
            </div>
          ) : (
            <>
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-4 px-2 pointer-events-none opacity-10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-slate-500 border-dashed" />
                ))}
              </div>

              {/* Sparkline */}
              <div className="absolute inset-0 p-4">
                <svg
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <defs>
                    <linearGradient id={chart.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.color} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={chart.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path
                    d={`${chart.pathData} L 100 100 L 0 100 Z`}
                    fill={`url(#${chart.gradientId})`}
                    className="transition-all duration-500 ease-in-out"
                  />

                  {/* Line */}
                  <path
                    d={chart.pathData}
                    fill="none"
                    stroke={chart.color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className="transition-all duration-500 ease-in-out"
                    style={{
                      filter: `drop-shadow(0 4px 6px ${chart.color}40)`,
                    }}
                  />
                </svg>
              </div>

              {/* Price Labels */}
              <div className="absolute right-2 top-2 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 backdrop-blur-sm">
                {formatPrice(chart.max)}
              </div>
              <div className="absolute right-2 bottom-2 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 backdrop-blur-sm">
                {formatPrice(chart.min)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const TechnicalStudyChart = memo(TechnicalStudyChartComponent);
