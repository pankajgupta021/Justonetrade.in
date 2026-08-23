"use client";

import { useEffect, useMemo, useState, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Loader2, RefreshCw } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";

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

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTime(value: number, timeframe: ChartTimeframe) {
  return new Intl.DateTimeFormat("en-US", {
    month: timeframe === "D" ? "short" : undefined,
    day: timeframe === "D" ? "numeric" : undefined,
    hour: timeframe === "D" ? undefined : "numeric",
    minute: timeframe === "D" ? undefined : "2-digit",
  }).format(new Date(value));
}

function TechnicalStudyChartComponent({
  defaultTimeframe = "5",
  height = 560,
  className = "",
  showTimeframeBar = true,
}: TechnicalStudyChartProps) {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(defaultTimeframe);
  const { data: chartData, isLoading, error, marketOpen } = useMarketData(timeframe);

  const chart = useMemo(() => {
    const points = chartData?.points ?? [];
    const width = 900;
    const height = 420;
    const padding = { top: 30, right: 24, bottom: 36, left: 56 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    if (points.length < 2) {
      return { width, height, path: "", areaPath: "", grid: [], labels: [], lastPoint: null };
    }

    const values = points.map((point) => point.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const paddedMin = min - range * 0.08;
    const paddedMax = max + range * 0.08;
    const paddedRange = paddedMax - paddedMin || 1;

    const getX = (index: number) => padding.left + (index / (points.length - 1)) * innerWidth;
    const getY = (close: number) => padding.top + ((paddedMax - close) / paddedRange) * innerHeight;

    const path = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(index).toFixed(2)} ${getY(point.close).toFixed(2)}`)
      .join(" ");

    const lastX = getX(points.length - 1);
    const firstX = getX(0);
    const baseY = padding.top + innerHeight;
    const areaPath = `${path} L ${lastX.toFixed(2)} ${baseY} L ${firstX.toFixed(2)} ${baseY} Z`;

    const grid = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = paddedMax - ratio * paddedRange;
      const y = padding.top + ratio * innerHeight;
      return { y, value };
    });

    const labelIndexes = Array.from(new Set([
      0,
      Math.floor((points.length - 1) / 2),
      points.length - 1,
    ]));

    const labels = labelIndexes.map((index) => ({
      x: getX(index),
      label: formatTime(points[index].time, timeframe),
    }));

    return {
      width,
      height,
      path,
      areaPath,
      grid,
      labels,
      lastPoint: { x: lastX, y: getY(points[points.length - 1].close) },
    };
  }, [chartData, timeframe]);

  const isPositive = (chartData?.change ?? 0) >= 0;

  return (
    <div className={`flex flex-col w-full rounded-xl overflow-hidden border border-border bg-card shadow-lg ${className}`}>
      {showTimeframeBar && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground tracking-tight">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>SPCFD</span>
            </div>
            {marketOpen ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Study
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 py-0.5">
                Market Closed
              </Badge>
            )}
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
                    onClick={() => {
                      setTimeframe(tf.value);
                    }}
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

      <div
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        className="w-full relative min-h-[420px] bg-slate-950 text-slate-100"
      >
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold tabular-nums">
                {chartData ? formatPrice(chartData.price) : "--"}
              </div>
              {typeof chartData?.change === "number" && typeof chartData.changePercent === "number" && (
                <Badge className={`${isPositive ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-red-500/15 text-red-300 border-red-500/30"} border font-bold tabular-nums`}>
                  {isPositive ? "+" : ""}
                  {chartData.change.toFixed(2)} ({isPositive ? "+" : ""}
                  {chartData.changePercent.toFixed(2)}%)
                </Badge>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {chartData ? `${chartData.source} data · Updated ${new Date(chartData.updatedAt).toLocaleTimeString()}` : "Loading Twelve Data"}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            ) : marketOpen ? (
              <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin-slow" />
            ) : (
              <Clock className="h-4 w-4 text-slate-400" />
            )}
            <span>{marketOpen ? "Live Streaming" : "Market Closed"}</span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="SPCFD realtime chart"
        >
          <defs>
            <linearGradient id="spcfdLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="spcfdArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <rect width={chart.width} height={chart.height} fill="#020617" />
          {chart.grid.map((line) => (
            <g key={line.y}>
              <line x1="56" x2="876" y1={line.y} y2={line.y} stroke="#1e293b" strokeWidth="1" />
              <text x="16" y={line.y + 4} fill="#64748b" fontSize="11" fontFamily="monospace">
                {formatPrice(line.value)}
              </text>
            </g>
          ))}

          {chart.areaPath && <path d={chart.areaPath} fill="url(#spcfdArea)" />}
          {chart.path && (
            <path
              d={chart.path}
              fill="none"
              stroke="url(#spcfdLine)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {chart.lastPoint && (
            <circle
              cx={chart.lastPoint.x}
              cy={chart.lastPoint.y}
              r="5"
              fill="#22c55e"
              stroke="#dcfce7"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {chart.labels.map((item) => (
            <text key={`${item.x}-${item.label}`} x={item.x} y="402" textAnchor="middle" fill="#64748b" fontSize="11">
              {item.label}
            </text>
          ))}
        </svg>

        {(isLoading || error || !chartData?.points.length) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center">
            <div className="flex flex-col items-center gap-2 text-sm text-slate-300">
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />}
              <span>{error ?? "Loading SPCFD chart..."}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const TechnicalStudyChart = memo(TechnicalStudyChartComponent);
