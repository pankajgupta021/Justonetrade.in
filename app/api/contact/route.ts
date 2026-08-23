import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch("https://formspree.io/f/moeazlrp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const data = await response.json();
      return NextResponse.json(
        { error: data.errors?.[0]?.message || "Failed to submit form" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
