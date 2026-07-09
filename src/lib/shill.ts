// Shill detection for Reddit results — the scammer-dodging layer.
// Sellers self-promote in W2C threads with sockpuppet accounts; these
// deterministic heuristics flag the patterns before you trust a "review".

export interface ShillCheck {
  suspicious: boolean;
  reasons: string[];
}

interface PostLike {
  author: string;
  title: string;
  snippet?: string;
  score: number;
  numComments: number;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** loose containment/overlap match between an author handle and a seller name */
export function authorMatchesSeller(author: string, sellerNames: string[]): boolean {
  const a = normalize(author);
  if (a.length < 4) return false;
  for (const name of sellerNames) {
    const n = normalize(name);
    if (n.length < 4) continue;
    if (a.includes(n) || n.includes(a)) return true;
    // shared prefix of 5+ chars (e.g. "topfashion7" vs "topfashion_seller")
    let common = 0;
    while (common < Math.min(a.length, n.length) && a[common] === n[common]) common++;
    if (common >= 5) return true;
  }
  return false;
}

/**
 * Analyze a result set. Flags:
 *  - author handle resembles the seller being searched (self-promo)
 *  - same author flooding the results (3+ posts pushing something)
 *  - zero-engagement promo pattern (no upvotes, no discussion, seller named)
 */
export function analyzeShills<T extends PostLike>(
  posts: T[],
  sellerNames: string[] = []
): Map<T, ShillCheck> {
  const authorCounts = new Map<string, number>();
  for (const p of posts) {
    if (!p.author || p.author === "[deleted]") continue;
    authorCounts.set(p.author, (authorCounts.get(p.author) || 0) + 1);
  }

  const out = new Map<T, ShillCheck>();
  for (const p of posts) {
    const reasons: string[] = [];

    if (sellerNames.length > 0 && authorMatchesSeller(p.author, sellerNames)) {
      reasons.push("Author handle resembles the seller — likely self-promo");
    }
    if ((authorCounts.get(p.author) || 0) >= 3) {
      reasons.push(`u/${p.author} posted ${authorCounts.get(p.author)}× in these results`);
    }
    const text = `${p.title} ${p.snippet ?? ""}`.toLowerCase();
    const namesSeller = sellerNames.some(
      (n) => n.length >= 4 && text.includes(n.toLowerCase())
    );
    if (p.score <= 1 && p.numComments === 0 && namesSeller) {
      reasons.push("Zero engagement + names the seller — unverified promo");
    }

    out.set(p, { suspicious: reasons.length > 0, reasons });
  }
  return out;
}
