// Clients for the edge functions: scrape, ingest-images, reddit, ai.
// Every call has a demo-mode fallback so the app is fully usable offline.
import { supabase } from "@/integrations/supabase/client";
import { isDemo } from "@/lib/demo";
import type { RedditThreadRef, ScrapeResult } from "@/types";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

// ————— scrape —————

export interface RawScrape {
  title: string;
  description: string;
  images: string[];
  sellerName: string;
  sellerSubdomain: string;
  albumId: string;
  priceCNY: number | null;
  itemUrl: string;
  sourcePlatform: string;
  batch: string | null;
  brand: string;
  category: string;
  confidence: Record<string, string>;
  cached?: boolean;
  error?: string;
}

export async function scrapeUrl(url: string, userBrands: string[]): Promise<RawScrape> {
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 900));
    return {
      title: "Demo Scraped Hoodie Heavyweight 480gsm",
      description: "现货 ¥228 heavy fleece",
      images: [],
      sellerName: "topfashion7",
      sellerSubdomain: "topfashion7",
      albumId: "demo-album",
      priceCNY: 228,
      itemUrl: "https://weidian.com/item.html?itemID=7000000001",
      sourcePlatform: "yupoo",
      batch: null,
      brand: "Essentials",
      category: "Tops",
      confidence: { title: "high", price: "high", images: "low" },
    };
  }
  const { data, error } = await supabase.functions.invoke("scrape", {
    body: { url, userBrands },
  });
  if (error) throw new Error(error.message || "Scrape failed");
  if (data?.error) throw new Error(data.error);
  return data as RawScrape;
}

export function scrapeToResult(raw: RawScrape): ScrapeResult {
  return {
    title: raw.title,
    description: raw.description,
    images: raw.images,
    sellerName: raw.sellerName,
    sellerSubdomain: raw.sellerSubdomain,
    albumId: raw.albumId,
    priceCNY: raw.priceCNY,
    itemUrl: raw.itemUrl,
    sourcePlatform: (raw.sourcePlatform as ScrapeResult["sourcePlatform"]) || "other",
    batch: raw.batch,
    brand: raw.brand || null,
    category: raw.category || null,
    confidence: {
      title: raw.confidence?.title === "high" ? 1 : raw.confidence?.title === "medium" ? 0.6 : 0.2,
      price: raw.confidence?.price === "high" ? 1 : raw.confidence?.price === "medium" ? 0.6 : 0.2,
    },
  };
}

/** fire-and-forget permanent image rehosting after an item is saved */
export async function ingestItemImages(
  productId: string,
  imageUrls: string[],
  sellerSubdomain: string
): Promise<void> {
  if (isDemo() || imageUrls.length === 0) return;
  try {
    await supabase.functions.invoke("ingest-images", {
      body: { productId, imageUrls, sellerSubdomain },
    });
  } catch (e) {
    console.warn("ingest-images failed (item still saved)", e);
  }
}

// ————— reddit —————

export interface RedditPost {
  redditId: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  permalink: string;
  url: string;
  snippet: string;
  thumbnail: string;
  postedAt: number;
}

const DEMO_POSTS: RedditPost[] = [
  {
    redditId: "demo1",
    title: "QC — Chrome Hearts Cemetery Cross Hoodie from topfashion7 (¥268)",
    subreddit: "FashionReps",
    author: "qc_lord",
    score: 342,
    numComments: 58,
    permalink: "https://www.reddit.com/r/FashionReps/comments/demo1",
    url: "",
    snippet:
      "11 days seller to warehouse. Cross patches are properly stitched not glued, fleece is heavy. Sizing runs about half a size big...",
    thumbnail: "",
    postedAt: Date.now() - 5 * 86400000,
  },
  {
    redditId: "demo2",
    title: "W2C best Stone Island ghost pieces? Comparing 3 sellers",
    subreddit: "FashionReps",
    author: "stoney_collector",
    score: 187,
    numComments: 92,
    permalink: "https://www.reddit.com/r/FashionReps/comments/demo2",
    url: "",
    snippet: "Ordered the same overshirt from three sellers to compare badge quality and fabric weight...",
    thumbnail: "",
    postedAt: Date.now() - 12 * 86400000,
  },
  {
    redditId: "demo3",
    title: "[GUIDE] Shipping lines to US in 2026 — what actually clears customs",
    subreddit: "FashionReps",
    author: "shipping_sage",
    score: 1204,
    numComments: 245,
    permalink: "https://www.reddit.com/r/FashionReps/comments/demo3",
    url: "",
    snippet: "GD-EMS has been the most consistent this quarter. Avoid DHL for anything with logos...",
    thumbnail: "",
    postedAt: Date.now() - 30 * 86400000,
  },
];

export async function searchReddit(params: {
  q: string;
  subs: string[];
  sort?: string;
  time?: string;
  limit?: number;
}): Promise<RedditPost[]> {
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 700));
    return DEMO_POSTS;
  }
  const { data, error } = await supabase.functions.invoke("reddit", {
    body: { action: "search", ...params },
  });
  if (error) throw new Error(error.message || "Reddit search failed");
  if (data?.error) throw new Error(data.error);
  return (data?.posts ?? []) as RedditPost[];
}

// ————— ai —————

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  if (isDemo()) {
    const demo =
      "Looking at your archive, the **Chrome Hearts Cemetery Cross Hoodie** is your strongest cop right now — topfashion7 is community vetted and the price is right at ¥268. I'd pair it with the **Stone Island Ghost Piece Overshirt** already in your Spring Haul to spread the shipping cost across more value. Skip the **Balenciaga Track 3.0 Triple Black** — you already flagged the mesh quality.";
    for (const word of demo.split(/(?<= )/)) {
      await new Promise((r) => setTimeout(r, 18));
      onDelta(word);
    }
    return;
  }

  const headers = await authHeaders();
  const res = await fetch(`${FN_URL}/ai`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "chat", messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `AI request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.text) onDelta(parsed.text);
        if (parsed.error) throw new Error(parsed.error);
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
      }
    }
  }
}

export interface VetResult {
  verdict: string;
  summary: string;
  sources: RedditThreadRef[];
  evidenceCount: number;
}

export async function vetSeller(sellerId: string, subs: string[]): Promise<VetResult> {
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      verdict: "community",
      summary:
        "Solid community record. Recent QC posts show consistent quality on hoodies and outerwear; W2C threads regularly name this seller as the go-to. No scam reports in the last two years. **Bottom line:** safe to order.",
      sources: [
        {
          permalink: "https://www.reddit.com/r/FashionReps/comments/demo1",
          title: "QC — Chrome Hearts hoodie from this seller",
          subreddit: "FashionReps",
          score: 342,
        },
      ],
      evidenceCount: 14,
    };
  }
  const { data, error } = await supabase.functions.invoke("ai", {
    body: { action: "vet_seller", sellerId, subs },
  });
  if (error) throw new Error(error.message || "Vetting failed");
  if (data?.error) throw new Error(data.error);
  return data as VetResult;
}

export interface ParsedImportItem {
  title: string;
  brand: string;
  category: string;
  priceCNY: number | null;
  priceUSD: number | null;
  batch: string | null;
  size: string;
  url: string;
  sellerName: string;
  notes: string;
}

export async function parseImport(text: string): Promise<ParsedImportItem[]> {
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 1200));
    return [
      {
        title: "Denim Tears Cotton Wreath Sweatpants",
        brand: "Denim Tears",
        category: "Bottoms",
        priceCNY: 218,
        priceUSD: null,
        batch: null,
        size: "L",
        url: "https://weidian.com/item.html?itemID=7000000002",
        sellerName: "topfashion7",
        notes: "heard the flock print cracks after washing — cold wash only",
      },
      {
        title: "Jordan 1 Retro High Chicago Lost & Found",
        brand: "Jordan",
        category: "Shoes",
        priceCNY: 469,
        priceUSD: null,
        batch: "GET",
        size: "US 10",
        url: "",
        sellerName: "",
        notes: "",
      },
    ];
  }
  const { data, error } = await supabase.functions.invoke("ai", {
    body: { action: "parse_import", text },
  });
  if (error) throw new Error(error.message || "Import parsing failed");
  if (data?.error) throw new Error(data.error);
  return (data?.items ?? []) as ParsedImportItem[];
}
