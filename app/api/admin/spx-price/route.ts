import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN_PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch SPX price from Yahoo Finance
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1m&range=1d",
      {
        next: { revalidate: 15 }, // Cache for 15 seconds
      }
    );

    if (!res.ok) {
      throw new Error(`Yahoo Finance responded with status ${res.status}`);
    }

    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (!price) {
      return NextResponse.json({ error: "Price data not found in response" }, { status: 404 });
    }

    return NextResponse.json({ price });
  } catch (error) {
    console.error("SPX Price Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch real-time SPX price" },
      { status: 500 }
    );
  }
}
