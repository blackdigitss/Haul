// Deterministic seller trust scoring + category strengths.
// Answers "which seller do I trust, and for what?" at a glance — no AI cost.
import type { Item, Seller } from "@/types";

export interface TrustScore {
  /** 0–100 */
  score: number;
  band: "solid" | "promising" | "unproven" | "risky";
  /** short reasons shown in the UI */
  signals: string[];
}

export function trustScore(
  seller: Pick<Seller, "vetStatus" | "ratings" | "vettedAt">,
  sellerItems: Pick<Item, "status" | "rating">[],
  redditRefCount: number
): TrustScore {
  const signals: string[] = [];
  let score = 0;

  // community vetting is the strongest signal
  switch (seller.vetStatus) {
    case "trusted":
      score += 45;
      signals.push("You've had good orders");
      break;
    case "community":
      score += 35;
      signals.push("Positive Reddit record");
      break;
    case "unvetted":
      score += 15;
      break;
    case "caution":
      signals.push("Red flags found");
      break;
  }

  // your own multi-axis ratings (up to 25)
  const ratings = Object.values(seller.ratings).filter((r) => r > 0);
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    score += Math.round((avg / 5) * 25);
    if (avg >= 4) signals.push(`Rated ${avg.toFixed(1)}/5 by you`);
  }

  // proven deliveries (up to 18)
  const delivered = sellerItems.filter((i) => i.status === "delivered").length;
  if (delivered > 0) {
    score += Math.min(delivered * 6, 18);
    signals.push(`${delivered} delivered`);
  }

  // saved research (up to 12)
  if (redditRefCount > 0) {
    score += Math.min(redditRefCount * 4, 12);
    signals.push(`${redditRefCount} saved threads`);
  }

  // a caution verdict caps everything
  if (seller.vetStatus === "caution") score = Math.min(score, 25);

  score = Math.max(0, Math.min(100, score));
  const band =
    score >= 75 ? "solid" : score >= 50 ? "promising" : score >= 30 ? "unproven" : "risky";
  return { score, band, signals: signals.slice(0, 3) };
}

export const TRUST_BAND_CONFIG: Record<
  TrustScore["band"],
  { label: string; token: string }
> = {
  solid: { label: "Solid", token: "vet-trusted" },
  promising: { label: "Promising", token: "vet-community" },
  unproven: { label: "Unproven", token: "vet-unvetted" },
  risky: { label: "Risky", token: "vet-caution" },
};

/**
 * What is this seller best for? Categories weighted by evidence:
 * delivered items count triple, highly-rated items double.
 */
export function categoryStrengths(
  sellerItems: Pick<Item, "category" | "status" | "rating">[],
  max = 2
): string[] {
  const weights = new Map<string, number>();
  for (const item of sellerItems) {
    if (!item.category) continue;
    let w = 1;
    if (item.status === "delivered") w += 2;
    if (item.rating >= 4) w += 1;
    weights.set(item.category, (weights.get(item.category) || 0) + w);
  }
  return [...weights.entries()]
    .filter(([, w]) => w >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([cat]) => cat);
}
