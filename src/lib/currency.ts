const CACHE_KEY = "haul_exchange_rate_v2";
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
export const FALLBACK_RATE = 0.14;

interface CachedRate {
  rate: number;
  timestamp: number;
}

/**
 * Live CNY → USD rate from open.er-api.com (free, keyless), 4h localStorage
 * cache, exchangerate.host fallback, stale-cache fallback, constant fallback.
 */
export async function fetchExchangeRate(): Promise<number> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRate = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) return parsed.rate;
    }
  } catch {}

  for (const url of [
    "https://open.er-api.com/v6/latest/CNY",
    "https://api.exchangerate.host/latest?base=CNY&symbols=USD",
  ]) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rate = data.rates?.USD;
        if (typeof rate === "number" && rate > 0) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
          } catch {}
          return rate;
        }
      }
    } catch {}
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached).rate;
  } catch {}

  return FALLBACK_RATE;
}

export function convertCNYtoUSD(amountCNY: number, rate: number): number {
  return Math.round(amountCNY * rate * 100) / 100;
}
