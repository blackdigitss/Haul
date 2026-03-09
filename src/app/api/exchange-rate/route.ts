import { NextResponse } from "next/server";

// Cache the exchange rate for 24 hours
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_RATE = 0.14; // Approximate CNY to USD

export async function GET() {
  try {
    // Return cached rate if still fresh
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        rate: cachedRate.rate,
        cached: true,
        updated: new Date(cachedRate.timestamp).toISOString(),
      });
    }

    // Try exchangerate-api.com (free tier)
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    let rate: number | null = null;

    if (apiKey) {
      try {
        const res = await fetch(
          `https://v6.exchangerate-api.com/v6/${apiKey}/pair/CNY/USD`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.conversion_rate) {
            rate = data.conversion_rate;
          }
        }
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback: try free API without key
    if (!rate) {
      try {
        const res = await fetch(
          "https://open.er-api.com/v6/latest/CNY",
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.rates?.USD) {
            rate = data.rates.USD;
          }
        }
      } catch {
        // Use fallback
      }
    }

    const finalRate = rate || FALLBACK_RATE;

    cachedRate = { rate: finalRate, timestamp: Date.now() };

    return NextResponse.json({
      rate: finalRate,
      cached: false,
      updated: new Date().toISOString(),
      fallback: !rate,
    });
  } catch {
    return NextResponse.json({
      rate: FALLBACK_RATE,
      cached: false,
      fallback: true,
      updated: new Date().toISOString(),
    });
  }
}
