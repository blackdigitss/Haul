// Client-side mirrors of the scraper's detection heuristics, used by the
// manual-entry form (paste a title/price string, get fields for free).
import { BATCH_CONFIG } from "@/types";

/** Weighted CNY price extraction from messy listing text. */
export function parsePriceCNY(text: string): { value: number | null; confidence: "high" | "medium" | "low" } {
  if (!text) return { value: null, confidence: "low" };
  const candidates: { v: number; c: number }[] = [];
  const patterns: { re: RegExp; weight: number }[] = [
    { re: /[¥￥]\s*(\d{2,5})/g, weight: 3 },
    { re: /(?:RMB|rmb|cny|CNY)\s*[:：]?\s*(\d{2,5})/g, weight: 3 },
    { re: /(?:价格|售价|价)[:：\s]*(\d{2,5})/g, weight: 3 },
    { re: /(\d{2,5})\s*(?:元|块|rmb|cny|yuan)/gi, weight: 2 },
    { re: /\$\s*(\d{2,4})/g, weight: 1 },
  ];
  for (const { re, weight } of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const v = parseInt(m[1], 10);
      if (v >= 30 && v <= 50000) candidates.push({ v, c: weight });
    }
  }
  if (candidates.length === 0) return { value: null, confidence: "low" };
  const tally = new Map<number, number>();
  for (const { v, c } of candidates) tally.set(v, (tally.get(v) || 0) + c);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  return { value: top[0], confidence: top[1] >= 3 ? "high" : top[1] >= 2 ? "medium" : "low" };
}

/** Detect a known batch code (LJR, PK GOD, …) in listing text. */
export function detectBatch(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  const codes = Object.keys(BATCH_CONFIG).sort((a, b) => b.length - a.length);
  for (const code of codes) {
    const re = new RegExp(`(?:^|[^A-Z])${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^A-Z]|$)`, "i");
    if (re.test(upper)) return code;
  }
  return null;
}

/** Yupoo seller subdomain from any of their URLs. */
export function extractYupooSubdomain(url: string): string | null {
  const m = url.match(/https?:\/\/([a-zA-Z0-9_-]+)\.(?:x\.)?yupoo\.com/);
  return m ? m[1] : null;
}
