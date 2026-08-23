import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  const resolution = url.searchParams.get("resolution");
  
  const TWELVEDATA_API_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;

  if (!TWELVEDATA_API_KEY) {
    return NextResponse.json({ error: "Missing TwelveData API Key" }, { status: 500 });
  }

  if (!symbol || !resolution) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${resolution}&outputsize=250&apikey=${TWELVEDATA_API_KEY}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("TwelveData proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch from TwelveData" }, { status: 500 });
  }
}
