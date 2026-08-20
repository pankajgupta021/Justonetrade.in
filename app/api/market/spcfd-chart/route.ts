import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ChartTimeframe = "5" | "15" | "30" | "60" | "120" | "180" | "240" | "D";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

const timeframeConfig: Record<ChartTimeframe, { interval: string; range: string; aggregateBy?: number }> = {
  "5": { interval: "5m", range: "1d" },
  "15": { interval: "15m", range: "5d" },
  "30": { interval: "30m", range: "5d" },
  "60": { interval: "60m", range: "1mo" },
  "120": { interval: "60m", range: "1mo", aggregateBy: 2 },
  "180": { interval: "60m", range: "1mo", aggregateBy: 3 },
  "240": { interval: "60m", range: "3mo", aggregateBy: 4 },
  D: { interval: "1d", range: "1y" },
};

const symbols = [
  { query: "ES=F", label: "Yahoo ES=F" },
  { query: "%5EGSPC", label: "Yahoo ^GSPC" },
];

function isTimeframe(value: string | null): value is ChartTimeframe {
  return value !== null && value in timeframeConfig;
}

function aggregatePoints(
  points: { time: number; close: number }[],
  size: number
) {
  const aggregated: { time: number; close: number }[] = [];

  for (let index = 0; index < points.length; index += size) {
    const group = points.slice(index, index + size);
    const last = group[group.length - 1];
    if (last) {
      aggregated.push(last);
    }
  }

  return aggregated;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedTimeframe = url.searchParams.get("timeframe");
  const timeframe = isTimeframe(requestedTimeframe) ? requestedTimeframe : "5";
  const config = timeframeConfig[timeframe];

  for (const symbol of symbols) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.query}?interval=${config.interval}&range=${config.range}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as YahooChartResponse;
      const result = data.chart?.result?.[0];
      const timestamps = result?.timestamp ?? [];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];

      let points = timestamps
        .map((time, index) => ({ time: time * 1000, close: closes[index] }))
        .filter((point): point is { time: number; close: number } =>
          typeof point.close === "number" && Number.isFinite(point.close)
        );

      if (config.aggregateBy) {
        points = aggregatePoints(points, config.aggregateBy);
      }

      const latestPoint = points[points.length - 1];
      if (!latestPoint) {
        continue;
      }

      const previousClose = result?.meta?.previousClose;
      const latestPrice = result?.meta?.regularMarketPrice ?? latestPoint.close;
      const change = typeof previousClose === "number" ? latestPrice - previousClose : null;
      const changePercent = change !== null && previousClose
        ? (change / previousClose) * 100
        : null;

      return NextResponse.json({
        symbol: "SPCFD",
        source: symbol.label,
        timeframe,
        price: latestPrice,
        change,
        changePercent,
        updatedAt: Date.now(),
        points,
      });
    } catch (error) {
      console.warn(`Failed to fetch ${symbol.label} chart data:`, error);
    }
  }

  return NextResponse.json(
    { error: "SPCFD chart data is not available right now." },
    { status: 503 }
  );
}
