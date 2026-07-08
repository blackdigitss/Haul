// Universal catalog importer: Yupoo album (multi-strategy), Weidian item,
// generic OpenGraph fallback. Returns structured item data with per-field
// confidence, cached 24h in scrape_cache.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ---------- helpers ----------

function resolveUrl(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === "string") {
    if (img.startsWith("http")) return img;
    if (img.startsWith("//")) return `https:${img}`;
    if (img.startsWith("/")) return `https://photo.yupoo.com${img}`;
    return img.length > 5 ? img : null;
  }
  if (typeof img === "object") {
    const o = img as Record<string, unknown>;
    const path =
      o.origin || o.url || o.path || o.src || o.original || o.large || o.medium || o.thumb || "";
    return resolveUrl(path);
  }
  return null;
}

function basename(u: string): string {
  try {
    return new URL(u).pathname.split("/").pop() || u;
  } catch {
    return u;
  }
}

function dedupeImages(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (!u) continue;
    if (/avatar|icon|logo|favicon|emoji|qrcode/i.test(u)) continue;
    const key = basename(u).split("?")[0].replace(/_(small|medium|thumb|s|m)\./i, ".");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
  }
  return out;
}

function cleanTitle(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\s*-\s*Yupoo\s*$/i, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/(现货|新款|工厂直销|爆款|包邮|实拍|实物|质量|高品质|顶级)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPrice(text: string): { value: number | null; confidence: "high" | "medium" | "low" } {
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
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const confidence = top[1] >= 3 ? "high" : top[1] >= 2 ? "medium" : "low";
  return { value: top[0], confidence };
}

const BATCH_DICT = [
  "PK GOD", "PK BASF", "LJR", "PKGOD", "PK", "GET", "OG", "OWF", "H12",
  "GD", "QY", "BD", "DT", "S2", "TS", "Pure", "Top", "Z BATCH", "G5",
];

function detectBatch(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  for (const b of BATCH_DICT) {
    const re = new RegExp(`(?:^|[^A-Z])${b.toUpperCase()}(?:[^A-Z]|$)`, "i");
    if (re.test(upper)) return b;
  }
  return null;
}

const BRAND_ALIASES: Record<string, string[]> = {
  Nike: ["nike", "nk"],
  Jordan: ["jordan", "aj1", "aj4", "aj11", "air jordan"],
  Adidas: ["adidas", "adi", "yeezy"],
  "Louis Vuitton": ["louis vuitton", "lv", "louisvuitton"],
  Gucci: ["gucci", "gg"],
  Balenciaga: ["balenciaga", "bal"],
  "Off-White": ["off-white", "off white", "ow"],
  Dior: ["dior"],
  Chanel: ["chanel"],
  Prada: ["prada"],
  Hermes: ["hermes", "hermès"],
  "New Balance": ["new balance", "nb"],
  "The North Face": ["north face", "tnf"],
  Stussy: ["stussy", "stüssy"],
  Supreme: ["supreme"],
  Bape: ["bape", "a bathing ape"],
  Essentials: ["essentials", "fear of god", "fog"],
  "Chrome Hearts": ["chrome hearts", "ch "],
  "Stone Island": ["stone island", "stoney"],
  Moncler: ["moncler"],
  Arcteryx: ["arcteryx", "arc'teryx"],
};

function detectBrand(text: string, userBrands: string[] = []): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  for (const b of userBrands) {
    if (b && lower.includes(b.toLowerCase())) return b;
  }
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    for (const alias of aliases) {
      const re = new RegExp(
        `(?:^|\\W)${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(?:\\W|$)`,
        "i"
      );
      if (re.test(lower)) return canonical;
    }
  }
  return "";
}

const CATEGORY_HINTS: Record<string, string[]> = {
  Shoes: ["shoe", "sneaker", "boot", "trainer", "yeezy", "jordan", "aj", "dunk", "air force", "af1", "loafer", "slide"],
  Bags: ["bag", "backpack", "tote", "handbag", "clutch", "wallet", "duffle"],
  Tops: ["tee", "t-shirt", "shirt", "hoodie", "sweater", "polo", "sweatshirt", "tank"],
  Bottoms: ["pants", "shorts", "jeans", "trousers", "sweatpants", "cargos", "denim"],
  Outerwear: ["jacket", "coat", "parka", "puffer", "windbreaker", "vest", "fleece"],
  Accessories: ["belt", "hat", "cap", "scarf", "sunglasses", "glasses", "socks", "beanie", "gloves"],
  Watches: ["watch", "rolex", "ap ", "audemars", "patek"],
  Jewelry: ["necklace", "ring", "bracelet", "chain", "earring", "pendant"],
};

function detectCategory(text: string): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  for (const [cat, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some((h) => lower.includes(h))) return cat;
  }
  return "";
}

function extractWeidianLink(html: string): string {
  const m = html.match(/https?:\/\/(?:www\.)?weidian\.com\/item\.html\?[^"'\s<>]+/i);
  return m ? m[0] : "";
}

async function fetchHtml(url: string, referer: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { Referer: referer, "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.warn("fetchHtml failed", url, e);
    return null;
  }
}

function metaContent(html: string, property: string): string {
  const re = new RegExp(
    `<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${property}["']`,
    "i"
  );
  return (html.match(re)?.[1] || html.match(alt)?.[1] || "").trim();
}

// ---------- scrapers ----------

interface ScrapePayload {
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
}

async function scrapeYupoo(
  url: string,
  subdomain: string,
  albumId: string,
  userBrands: string[]
): Promise<ScrapePayload> {
  const sellerUrl = `https://${subdomain}.x.yupoo.com`;
  let title = "";
  let description = "";
  let images: string[] = [];
  let itemUrl = "";

  // Strategy 1: internal JSON API
  try {
    const res = await fetch(`${sellerUrl}/api/web/albums/${albumId}/show`, {
      headers: { Referer: sellerUrl, "User-Agent": UA },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      const album = data.data || data;
      title = album.title || "";
      description = album.description || album.desc || "";
      const raw = album.images || album.photos || album.image_list || [];
      for (const img of raw) {
        const u = resolveUrl(img);
        if (u) images.push(u);
      }
    }
  } catch (e) {
    console.warn("Yupoo API failed", e);
  }

  // Strategy 2: HTML scrape
  if (images.length === 0 || !title) {
    const html = await fetchHtml(url, sellerUrl);
    if (html) {
      if (!title) {
        title = metaContent(html, "og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
      }
      if (!description) {
        description = metaContent(html, "og:description") || metaContent(html, "description");
      }
      itemUrl = extractWeidianLink(html);

      const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\});\s*<\/script>/);
      if (stateMatch) {
        try {
          const state = JSON.parse(stateMatch[1]);
          const findImgs = (obj: unknown): void => {
            if (!obj) return;
            if (Array.isArray(obj)) {
              obj.forEach(findImgs);
              return;
            }
            if (typeof obj === "object") {
              const o = obj as Record<string, unknown>;
              if (o.path && typeof o.path === "string" && /\.(jpg|jpeg|png|webp)/i.test(o.path)) {
                const u = resolveUrl(o.path);
                if (u) images.push(u);
              }
              Object.values(o).forEach(findImgs);
            }
          };
          findImgs(state);
        } catch { /* ignore */ }
      }

      const patterns = [
        /data-origin-src=["']((?:https?:)?\/\/[^"']+)["']/g,
        /data-origin=["']((?:https?:)?\/\/[^"']+)["']/g,
        /data-src=["']((?:https?:)?\/\/photo\.yupoo\.com[^"']+)["']/g,
        /data-path=["']((?:https?:)?\/\/photo\.yupoo\.com[^"']+)["']/g,
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/g,
      ];
      for (const re of patterns) {
        let m;
        while ((m = re.exec(html)) !== null) {
          let u = m[1];
          if (u.startsWith("//")) u = `https:${u}`;
          images.push(u);
        }
      }

      if (images.length === 0) {
        const any = /["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?)["']/gi;
        let m;
        while ((m = any.exec(html)) !== null) {
          if (m[1].length > 20) images.push(m[1]);
        }
      }
    }
  }

  images = dedupeImages(images);
  const cleanedTitle = cleanTitle(title);
  const fullText = `${title} ${description}`;
  const price = extractPrice(fullText);

  return {
    title: cleanedTitle,
    description,
    images,
    sellerName: subdomain,
    sellerSubdomain: subdomain,
    albumId,
    priceCNY: price.value,
    itemUrl,
    sourcePlatform: "yupoo",
    batch: detectBatch(fullText),
    brand: detectBrand(fullText, userBrands),
    category: detectCategory(fullText),
    confidence: {
      title: cleanedTitle ? "high" : "low",
      price: price.confidence,
      images: images.length > 2 ? "high" : images.length > 0 ? "medium" : "low",
    },
  };
}

async function scrapeWeidian(
  url: string,
  itemId: string,
  userBrands: string[]
): Promise<ScrapePayload> {
  const canonical = `https://weidian.com/item.html?itemID=${itemId}`;
  let title = "";
  let description = "";
  let images: string[] = [];
  let priceCNY: number | null = null;
  let priceConfidence: "high" | "medium" | "low" = "low";

  const html = await fetchHtml(canonical, "https://weidian.com/");
  if (html) {
    title = metaContent(html, "og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
    description = metaContent(html, "og:description") || metaContent(html, "description");
    const ogImage = metaContent(html, "og:image");
    if (ogImage) images.push(ogImage.startsWith("//") ? `https:${ogImage}` : ogImage);

    // Weidian embeds item data as JSON in the page
    const priceMatch =
      html.match(/"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/) ||
      html.match(/"itemPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/) ||
      html.match(/"lowPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/);
    if (priceMatch) {
      const v = parseFloat(priceMatch[1]);
      // Weidian sometimes reports prices in fen (cents)
      priceCNY = v > 100000 ? Math.round(v / 100) : Math.round(v);
      priceConfidence = "medium";
    }

    const imgRe = /["'](https?:\/\/[^"'\s]*(?:wdcdn\.net|weidian\.com)[^"'\s]*\.(?:jpg|jpeg|png|webp)[^"'\s]*)["']/gi;
    let m;
    while ((m = imgRe.exec(html)) !== null) images.push(m[1]);

    if (priceCNY === null) {
      const p = extractPrice(`${title} ${description} ${html.slice(0, 20000)}`);
      priceCNY = p.value;
      priceConfidence = p.confidence;
    }
  }

  images = dedupeImages(images);
  const cleanedTitle = cleanTitle(title.replace(/\s*[-|]\s*微店\s*$/, ""));
  const fullText = `${title} ${description}`;

  return {
    title: cleanedTitle,
    description,
    images,
    sellerName: "",
    sellerSubdomain: "",
    albumId: `wd-${itemId}`,
    priceCNY,
    itemUrl: canonical,
    sourcePlatform: "weidian",
    batch: detectBatch(fullText),
    brand: detectBrand(fullText, userBrands),
    category: detectCategory(fullText),
    confidence: {
      title: cleanedTitle ? "medium" : "low",
      price: priceConfidence,
      images: images.length > 2 ? "high" : images.length > 0 ? "medium" : "low",
    },
  };
}

async function scrapeGeneric(url: string, userBrands: string[]): Promise<ScrapePayload> {
  let title = "";
  let description = "";
  const images: string[] = [];

  const html = await fetchHtml(url, url);
  if (html) {
    title = metaContent(html, "og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
    description = metaContent(html, "og:description") || metaContent(html, "description");
    const ogImage = metaContent(html, "og:image");
    if (ogImage) images.push(ogImage.startsWith("//") ? `https:${ogImage}` : ogImage);
  }

  const cleanedTitle = cleanTitle(title);
  const fullText = `${title} ${description}`;
  const price = extractPrice(fullText);

  return {
    title: cleanedTitle,
    description,
    images: dedupeImages(images),
    sellerName: "",
    sellerSubdomain: "",
    albumId: "",
    priceCNY: price.value,
    itemUrl: "",
    sourcePlatform: "other",
    batch: detectBatch(fullText),
    brand: detectBrand(fullText, userBrands),
    category: detectCategory(fullText),
    confidence: { title: cleanedTitle ? "medium" : "low", price: price.confidence, images: "low" },
  };
}

// ---------- handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userBrands } = await req.json();
    if (!url) return jsonResponse({ error: "Missing url" }, 400);
    const brands = Array.isArray(userBrands) ? userBrands : [];

    const yupoo = url.match(/https?:\/\/([a-zA-Z0-9_-]+)\.(?:x\.)?yupoo\.com\/albums\/(\d+)/);
    const weidian = url.match(/weidian\.com.*?[?&]item(?:ID|Id|_id)=(\d+)/i);

    const cacheKey = yupoo ? yupoo[2] : weidian ? `wd-${weidian[1]}` : `gen-${btoa(url).slice(0, 60)}`;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: cached } = await sb
      .from("scrape_cache")
      .select("payload, created_at")
      .eq("album_id", cacheKey)
      .maybeSingle();
    if (cached) {
      const ageH = (Date.now() - new Date(cached.created_at).getTime()) / 36e5;
      if (ageH < 24) return jsonResponse({ ...cached.payload, cached: true });
    }

    let payload: ScrapePayload;
    if (yupoo) {
      payload = await scrapeYupoo(url, yupoo[1], yupoo[2], brands);
    } else if (weidian) {
      payload = await scrapeWeidian(url, weidian[1], brands);
    } else {
      payload = await scrapeGeneric(url, brands);
    }

    await sb.from("scrape_cache").upsert({
      album_id: cacheKey,
      payload,
      created_at: new Date().toISOString(),
    });

    return jsonResponse(payload);
  } catch (error) {
    console.error("Scrape error:", error);
    return jsonResponse({ error: String(error) }, 500);
  }
});
