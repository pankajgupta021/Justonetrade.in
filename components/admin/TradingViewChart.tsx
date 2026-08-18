"use client";

import { useEffect, useRef, memo } from 'react';

function LiveSPXWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbol": "OANDA:SPX500USD",
        "width": "100%",
        "isTransparent": true,
        "colorTheme": "dark",
        "locale": "en"
      }`;
    container.current.appendChild(script);
  }, []);

  return (
    <div className="flex items-center justify-center my-1 rounded-md overflow-hidden bg-slate-900 border border-slate-700/50">
      <div className="tradingview-widget-container w-full" ref={container}>
      </div>
    </div>
  );
}

export const TradingViewChart = memo(LiveSPXWidget);
