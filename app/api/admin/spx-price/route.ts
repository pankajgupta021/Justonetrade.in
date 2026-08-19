import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN_PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const symbols = ["ES=F", "%5EGSPC"];
    let livePrice: number | null = null;
    let symbolUsed = "ES=F";

    for (const sym of symbols) {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            cache: "no-store",
          }
        );

        if (res.ok) {
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
          const latestCandleClose = quotes ? quotes.filter((v: number | null) => typeof v === "number").pop() : null;

          const price = meta?.regularMarketPrice || latestCandleClose;
          if (price && typeof price === "number" && !isNaN(price) && price > 1000) {
            livePrice = price;
            symbolUsed = sym;
            break;
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch price for ${sym}:`, err);
      }
    }

    if (!livePrice) {
      return NextResponse.json({ error: "Price data not available" }, { status: 404 });
    }

    return NextResponse.json({
      price: livePrice,
      symbol: symbolUsed,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("SPX Price Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch real-time SPX price" },
      { status: 500 }
    );
  }
}
