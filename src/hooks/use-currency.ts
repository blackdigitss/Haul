import { useEffect, useState } from "react";
import { FALLBACK_RATE, fetchExchangeRate } from "@/lib/currency";

/** Live CNY→USD rate, cached 4h in localStorage with layered fallbacks. */
export function useCurrency() {
  const [rate, setRate] = useState(FALLBACK_RATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchExchangeRate().then((r) => {
      if (alive) {
        setRate(r);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return { rate, loading };
}
