import { useState, useEffect, useRef, useCallback } from "react";
import { isMarketOpen } from "@/lib/market";

export type ChartTimeframe = "5" | "15" | "30" | "60" | "120" | "180" | "240" | "D";

export type ChartPoint = {
  time: number;
  close: number;
};

export type ChartData = {
  symbol: string;
  source: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  updatedAt: number;
  points: ChartPoint[];
};

const TWELVEDATA_API_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
const DEFAULT_SYMBOL = "SPX500_USD";

// Map frontend symbols to API symbols
const getTwelveDataSymbol = (symbol: string) => {
  if (symbol === "SPX500_USD" || symbol === "OANDA:SPX500_USD") return "SPY";
  return symbol;
};

// SPY tracks S&P 500 perfectly but is exactly 1/10th the price.
const getMultiplier = (symbol: string) => {
  if (symbol === "SPX500_USD" || symbol === "OANDA:SPX500_USD") return 10;
  return 1;
};

// Map our timeframes to TwelveData resolutions
const getTwelveDataInterval = (tf: ChartTimeframe) => {
  if (tf === "5") return "5min";
  if (tf === "15") return "15min";
  if (tf === "30") return "30min";
  if (tf === "60") return "1h";
  if (tf === "120") return "2h";
  if (tf === "180") return "1h";
  if (tf === "240") return "4h";
  if (tf === "D") return "1day";
  return "5min";
};

const getAggregateSize = (tf: ChartTimeframe) => {
  if (tf === "180") return 3;
  return 1;
};

const aggregatePoints = (points: ChartPoint[], size: number) => {
  if (size <= 1) return points;
  const aggregated: ChartPoint[] = [];
  for (let i = 0; i < points.length; i += size) {
    const group = points.slice(i, i + size);
    const last = group[group.length - 1];
    if (last) {
      aggregated.push(last);
    }
  }
  return aggregated;
};

export function useMarketData(
  timeframe: ChartTimeframe,
  symbol: string = DEFAULT_SYMBOL
) {
  const [data, setData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState(() => isMarketOpen());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  // Fetch initial REST data
  const fetchHistoricalData = useCallback(async () => {
    // If key is missing, warn but allow the proxy to potentially handle it if they hardcoded it server-side
    // However, if it is completely missing, Twelve Data will fail.

    try {
      setIsLoading(true);
      setError(null);

      const resolution = getTwelveDataInterval(timeframe);
      const aggSize = getAggregateSize(timeframe);
      const apiSymbol = getTwelveDataSymbol(symbol);
      const multiplier = getMultiplier(symbol);

      let res = await fetch(
        `/api/market/history?symbol=${encodeURIComponent(apiSymbol)}&resolution=${resolution}`
      );

      let resData = await res.json();

      if (resData.status === "ok" && resData.values) {
        // TwelveData returns descending order (newest first). We need ascending (oldest first).
        const values = resData.values.reverse();

        let points = values.map((item: any) => {
          // TwelveData time format: "2023-01-01 10:00:00"
          const time = new Date(item.datetime + " EST").getTime();
          return {
            time: isNaN(time) ? new Date(item.datetime).getTime() : time,
            close: parseFloat(item.close) * multiplier,
          };
        });

        points = aggregatePoints(points, aggSize);

        if (points.length > 0) {
          const latestPoint = points[points.length - 1];
          const previousPoint = points.length > 1 ? points[points.length - 2] : latestPoint;

          const change = latestPoint.close - previousPoint.close;
          const changePercent = (change / previousPoint.close) * 100;

          setData({
            symbol,
            source: "Twelve Data",
            price: latestPoint.close,
            change,
            changePercent,
            updatedAt: Date.now(),
            points,
          });
        }
      } else {
        console.error("TwelveData API Error:", resData);
        setError(resData.message || "No data available for symbol");
      }
    } catch (err) {
      console.error("Failed to fetch historical data:", err);
      setError("Failed to fetch historical data");
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!TWELVEDATA_API_KEY || !marketOpen) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const apiSymbol = getTwelveDataSymbol(symbol);
    const multiplier = getMultiplier(symbol);

    const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVEDATA_API_KEY}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      ws.send(JSON.stringify({
        action: "subscribe",
        params: {
          symbols: apiSymbol
        }
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.event === "price" && message.price) {
        const currentPrice = parseFloat(message.price) * multiplier;

        setData((prevData) => {
          if (!prevData || prevData.points.length === 0) return prevData;

          const newPoints = [...prevData.points];
          const lastPoint = { ...newPoints[newPoints.length - 1] };

          // Only update the close price of the current candle
          lastPoint.close = currentPrice;
          newPoints[newPoints.length - 1] = lastPoint;

          const previousPoint = newPoints.length > 1 ? newPoints[newPoints.length - 2] : lastPoint;
          const change = currentPrice - previousPoint.close;
          const changePercent = (change / previousPoint.close) * 100;

          return {
            ...prevData,
            price: currentPrice,
            change,
            changePercent,
            updatedAt: Date.now(),
            points: newPoints,
          };
        });
      }
    };

    ws.onclose = () => {
      if (isMarketOpen() && wsRef.current !== null) {
        const timeout = Math.min(5000 * Math.pow(1.5, reconnectAttempts.current), 65000);
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, timeout);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };
  }, [symbol, marketOpen]);

  const cleanupWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const currentMarketOpen = isMarketOpen();
    setMarketOpen(currentMarketOpen);

    fetchHistoricalData().then(() => {
      if (isMounted && currentMarketOpen) {
        connectWebSocket();
      }
    });

    const intervalId = setInterval(() => {
      const isOpen = isMarketOpen();
      setMarketOpen(isOpen);
      
      // TwelveData WebSocket free tier rejects SPY ETF.
      // So we fallback to polling the REST API every 60 seconds.
      if (isOpen) {
        fetchHistoricalData();
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      cleanupWebSocket();
    };
  }, [timeframe, symbol, fetchHistoricalData, connectWebSocket, cleanupWebSocket]);

  return { data, isLoading, error, marketOpen };
}
