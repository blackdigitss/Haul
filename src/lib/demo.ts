// Demo mode: a fully clickable in-memory archive, no backend required.
// Activate with ?demo=1 (persists for the tab). Used for previewing the app
// before Supabase is wired up, and for Playwright screenshots.
import type { Haul, Item, RedditRef, Seller, UserSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

const DEMO_KEY = "haul-demo";

/** single-file preview builds run permanently in demo mode */
export const IS_ARTIFACT = import.meta.env.VITE_ARTIFACT === "1";

export function isDemo(): boolean {
  if (IS_ARTIFACT) return true;
  try {
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      sessionStorage.setItem(DEMO_KEY, "1");
      return true;
    }
    return sessionStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@haul.app",
  user_metadata: { full_name: "Demo" },
} as const;

/** gradient SVG placeholder as a data URI — keeps demo mode fully offline */
function ph(hue: number, hue2: number, label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},35%,22%)'/><stop offset='1' stop-color='hsl(${hue2},45%,12%)'/></linearGradient></defs><rect width='600' height='800' fill='url(#g)'/><text x='50%' y='52%' font-family='sans-serif' font-size='120' fill='hsl(${hue},30%,88%)' fill-opacity='0.85' text-anchor='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const now = Date.now();
const d = (days: number) => now - days * 86400000;

function seedSellers(): Seller[] {
  const base = {
    userId: DEMO_USER.id,
    weidianUrl: "",
    whatsapp: "",
    wechat: "",
    notes: "",
    productCount: 0,
    vetSources: [],
  };
  return [
    {
      ...base,
      id: "s1",
      name: "topfashion7",
      subdomain: "topfashion7",
      yupooUrl: "https://topfashion7.x.yupoo.com",
      weidianUrl: "https://weidian.com/?userid=1234567",
      wechat: "topfashion_7",
      ratings: { quality: 5, accuracy: 4, communication: 5, shipping: 4, value: 4 },
      vetStatus: "community",
      vetSummary:
        "Strong community signal across r/FashionReps. Multiple recent QC posts on Essentials and Stone Island pieces with positive feedback on stitching and fit. A few notes about slow WhatsApp replies during sales, no scam reports found. **Bottom line:** safe to order, allow extra time around 11.11.",
      vetSources: [
        { permalink: "https://www.reddit.com/r/FashionReps/1", title: "QC — Stone Island badge hoodie from topfashion7", subreddit: "FashionReps", score: 214 },
        { permalink: "https://www.reddit.com/r/FashionReps/2", title: "W2C thread — everyone saying topfashion", subreddit: "FashionReps", score: 89 },
      ],
      vettedAt: d(3),
      createdAt: d(220),
      updatedAt: d(3),
    },
    {
      ...base,
      id: "s2",
      name: "husky",
      subdomain: "huskyreps",
      yupooUrl: "https://huskyreps.x.yupoo.com",
      ratings: { quality: 4, accuracy: 4, communication: 3, shipping: 4, value: 5 },
      vetStatus: "trusted",
      vetSummary: "Ordered twice — both hauls landed clean. Great value on denim.",
      vettedAt: d(40),
      createdAt: d(300),
      updatedAt: d(40),
    },
    {
      ...base,
      id: "s3",
      name: "vicky.sneakers",
      subdomain: "vickysneaker",
      yupooUrl: "https://vickysneaker.x.yupoo.com",
      ratings: { quality: 0, accuracy: 0, communication: 0, shipping: 0, value: 0 },
      vetStatus: "unvetted",
      vetSummary: "",
      vettedAt: null,
      createdAt: d(12),
      updatedAt: d(12),
    },
    {
      ...base,
      id: "s4",
      name: "kevin bags",
      subdomain: "kevinbags88",
      yupooUrl: "https://kevinbags88.x.yupoo.com",
      ratings: { quality: 2, accuracy: 2, communication: 3, shipping: 3, value: 2 },
      vetStatus: "caution",
      vetSummary:
        "Two 2024 threads report received items not matching album photos (wrong hardware on LV pieces). One unresolved dispute mentioned. Community mostly recommends alternatives for bags. **Bottom line:** research a specific QC before ordering.",
      vetSources: [
        { permalink: "https://www.reddit.com/r/DesignerReps/9", title: "Warning: kevinbags sent different batch than pictured", subreddit: "DesignerReps", score: 156 },
      ],
      vettedAt: d(8),
      createdAt: d(150),
      updatedAt: d(8),
    },
  ];
}

function seedItems(): Item[] {
  const base = {
    userId: DEMO_USER.id,
    imageUrls: [],
    thumbUrls: [],
    mainImageIndex: 0,
    albumId: "",
    rating: 0,
    tags: [],
    size: "",
    color: "",
    notes: "",
    haulId: null as string | null,
    weight: null,
  };
  return [
    {
      ...base,
      id: "i1",
      title: "Chrome Hearts Cemetery Cross Hoodie",
      priceCNY: 268,
      priceUSD: 37.5,
      images: [ph(15, 30, "CH"), ph(20, 40, "CH")],
      sellerId: "s1",
      sellerName: "topfashion7",
      yupooUrl: "https://topfashion7.x.yupoo.com/albums/123456",
      itemUrl: "https://weidian.com/item.html?itemID=7234567890",
      sourcePlatform: "yupoo" as const,
      status: "saved" as const,
      tier: "grail" as const,
      category: "Tops",
      brand: "Chrome Hearts",
      batch: null,
      size: "L",
      tags: ["hoodie", "grail"],
      notes: "Best version per multiple QC threads. Cross patches look 1:1.",
      rating: 0,
      haulId: null,
      createdAt: d(2),
      updatedAt: d(2),
    },
    {
      ...base,
      id: "i2",
      title: "Stone Island Ghost Piece Overshirt",
      priceCNY: 328,
      priceUSD: 45.9,
      images: [ph(140, 160, "SI")],
      sellerId: "s1",
      sellerName: "topfashion7",
      yupooUrl: "https://topfashion7.x.yupoo.com/albums/223344",
      itemUrl: "https://weidian.com/item.html?itemID=7234567891",
      sourcePlatform: "yupoo" as const,
      status: "planned" as const,
      tier: "cop" as const,
      category: "Outerwear",
      brand: "Stone Island",
      batch: null,
      size: "M",
      haulId: "h1",
      createdAt: d(6),
      updatedAt: d(1),
    },
    {
      ...base,
      id: "i3",
      title: "Jordan 4 Retro Military Black — LJR Batch",
      priceCNY: 499,
      priceUSD: 69.9,
      images: [ph(220, 240, "AJ4"), ph(230, 250, "AJ4")],
      sellerId: "s3",
      sellerName: "vicky.sneakers",
      yupooUrl: "https://vickysneaker.x.yupoo.com/albums/998877",
      itemUrl: "https://weidian.com/item.html?itemID=7234567892",
      sourcePlatform: "yupoo" as const,
      status: "planned" as const,
      tier: "cop" as const,
      category: "Shoes",
      brand: "Jordan",
      batch: "LJR",
      size: "US 10",
      haulId: "h1",
      notes: "LJR shape > GET for Militaries per r/Repsneakers megathread.",
      createdAt: d(9),
      updatedAt: d(1),
    },
    {
      ...base,
      id: "i4",
      title: "Essentials FW23 Hoodie Dark Oatmeal",
      priceCNY: 158,
      priceUSD: 22.1,
      images: [ph(35, 45, "E")],
      sellerId: "s1",
      sellerName: "topfashion7",
      yupooUrl: "https://topfashion7.x.yupoo.com/albums/445566",
      itemUrl: "https://weidian.com/item.html?itemID=7234567893",
      sourcePlatform: "yupoo" as const,
      status: "purchased" as const,
      tier: "want" as const,
      category: "Tops",
      brand: "Essentials",
      batch: null,
      size: "L",
      haulId: "h2",
      createdAt: d(30),
      updatedAt: d(5),
    },
    {
      ...base,
      id: "i5",
      title: "Louis Vuitton Keepall 50 Monogram Eclipse",
      priceCNY: 780,
      priceUSD: 109.2,
      images: [ph(260, 280, "LV")],
      sellerId: "s4",
      sellerName: "kevin bags",
      yupooUrl: "https://kevinbags88.x.yupoo.com/albums/112233",
      itemUrl: "",
      sourcePlatform: "yupoo" as const,
      status: "saved" as const,
      tier: "maybe" as const,
      category: "Bags",
      brand: "Louis Vuitton",
      batch: null,
      notes: "Seller flagged caution — find alternative W2C before pulling trigger.",
      createdAt: d(15),
      updatedAt: d(8),
    },
    {
      ...base,
      id: "i6",
      title: "Vintage Wash Double-Knee Work Pants",
      priceCNY: 189,
      priceUSD: 26.5,
      images: [ph(85, 100, "W")],
      sellerId: "s2",
      sellerName: "husky",
      yupooUrl: "https://huskyreps.x.yupoo.com/albums/667788",
      itemUrl: "https://weidian.com/item.html?itemID=7234567894",
      sourcePlatform: "yupoo" as const,
      status: "warehouse" as const,
      tier: "want" as const,
      category: "Bottoms",
      brand: "",
      batch: null,
      size: "32",
      haulId: "h2",
      createdAt: d(28),
      updatedAt: d(2),
    },
    {
      ...base,
      id: "i7",
      title: "Balenciaga Track 3.0 Triple Black",
      priceCNY: 560,
      priceUSD: 78.4,
      images: [ph(0, 15, "BAL")],
      sellerId: "s3",
      sellerName: "vicky.sneakers",
      yupooUrl: "https://vickysneaker.x.yupoo.com/albums/334455",
      itemUrl: "https://weidian.com/item.html?itemID=7234567895",
      sourcePlatform: "yupoo" as const,
      status: "saved" as const,
      tier: "pass" as const,
      category: "Shoes",
      brand: "Balenciaga",
      batch: null,
      notes: "Mesh quality looked off in the QC video. Passing.",
      createdAt: d(45),
      updatedAt: d(20),
    },
    {
      ...base,
      id: "i8",
      title: "Arc'teryx Beta LT Jacket Black",
      priceCNY: 428,
      priceUSD: 59.9,
      images: [ph(190, 210, "ARC")],
      sellerId: "s2",
      sellerName: "husky",
      yupooUrl: "https://huskyreps.x.yupoo.com/albums/554433",
      itemUrl: "https://weidian.com/item.html?itemID=7234567896",
      sourcePlatform: "yupoo" as const,
      status: "delivered" as const,
      tier: "cop" as const,
      category: "Outerwear",
      brand: "Arcteryx",
      batch: null,
      size: "M",
      rating: 5,
      notes: "Landed. GORE-TEX embossing is clean, zippers smooth. 10/10 cop.",
      createdAt: d(90),
      updatedAt: d(12),
    },
  ];
}

function seedHauls(): Haul[] {
  return [
    {
      id: "h1",
      userId: DEMO_USER.id,
      name: "Spring Haul — March",
      notes: "Target ~2kg to stay in the cheap EMS bracket.",
      status: "planning",
      shippingCostCNY: 0,
      agentFeeCNY: 30,
      totalCNY: 827,
      totalUSD: 115.8,
      productIds: ["i2", "i3"],
      shippingMethod: "ems",
      trackingNumber: "",
      estimatedWeightG: 2100,
      createdAt: d(9),
      updatedAt: d(1),
    },
    {
      id: "h2",
      userId: DEMO_USER.id,
      name: "Winter Restock",
      notes: "",
      status: "shipped",
      shippingCostCNY: 245,
      agentFeeCNY: 25,
      totalCNY: 347,
      totalUSD: 48.6,
      productIds: ["i4", "i6"],
      shippingMethod: "gd-ems",
      trackingNumber: "LX123456789CN",
      estimatedWeightG: 850,
      createdAt: d(30),
      updatedAt: d(2),
    },
  ];
}

function seedRedditRefs(): RedditRef[] {
  return [
    {
      id: "r1",
      userId: DEMO_USER.id,
      sellerId: "s1",
      productId: null,
      redditId: "abc123",
      permalink: "https://www.reddit.com/r/FashionReps/comments/abc123",
      title: "QC — Stone Island badge hoodie from topfashion7 (¥268)",
      subreddit: "FashionReps",
      author: "repArchiver",
      score: 214,
      numComments: 47,
      snippet: "Took 9 days to the warehouse. Badge stitching is clean, fleece feels heavy...",
      postedAt: d(20),
      pinned: true,
      createdAt: d(18),
    },
    {
      id: "r2",
      userId: DEMO_USER.id,
      sellerId: null,
      productId: "i3",
      redditId: "def456",
      permalink: "https://www.reddit.com/r/Repsneakers/comments/def456",
      title: "LJR vs GET Military Black comparison — 40+ photos",
      subreddit: "Repsneakers",
      author: "sneakerQC",
      score: 512,
      numComments: 133,
      snippet: "Side by side of both batches under sunlight. LJR toe box shape wins...",
      postedAt: d(60),
      pinned: false,
      createdAt: d(9),
    },
  ];
}

// ————— in-memory store with mutation support —————

interface DemoStore {
  items: Item[];
  sellers: Seller[];
  hauls: Haul[];
  redditRefs: RedditRef[];
  settings: UserSettings;
}

let store: DemoStore | null = null;

export function demoStore(): DemoStore {
  if (!store) {
    store = {
      items: seedItems(),
      sellers: seedSellers(),
      hauls: seedHauls(),
      redditRefs: seedRedditRefs(),
      settings: { ...DEFAULT_SETTINGS },
    };
  }
  return store;
}

export function demoId(): string {
  return `demo-${Math.random().toString(36).slice(2, 10)}`;
}
