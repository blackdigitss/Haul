// HAUL domain model — single source of truth for taxonomy, configs, and types.

export type Tier = "grail" | "cop" | "want" | "maybe" | "pass";

export type ItemStatus =
  | "saved"
  | "planned"
  | "purchased"
  | "warehouse"
  | "shipped"
  | "delivered";

export type HaulStatus = "planning" | "ordered" | "shipped" | "received";

export type VetStatus = "unvetted" | "community" | "trusted" | "caution";

export type SourcePlatform = "yupoo" | "weidian" | "taobao" | "other";

export interface Item {
  id: string;
  userId: string;
  title: string;
  priceCNY: number | null;
  priceUSD: number | null;
  /** original scraped URLs (may need proxying) */
  images: string[];
  /** permanent Supabase Storage URLs */
  imageUrls: string[];
  thumbUrls: string[];
  mainImageIndex: number;
  sellerId: string | null;
  sellerName: string;
  /** catalog link (Yupoo album etc.) — where you found it */
  yupooUrl: string;
  albumId: string;
  /** purchase link (Weidian/Taobao item) — what you paste into an agent */
  itemUrl: string;
  sourcePlatform: SourcePlatform;
  status: ItemStatus;
  tier: Tier;
  rating: number;
  tags: string[];
  category: string;
  brand: string;
  size: string;
  color: string;
  notes: string;
  haulId: string | null;
  batch: string | null;
  weight: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SellerRatings {
  quality: number;
  accuracy: number;
  communication: number;
  shipping: number;
  value: number;
}

export interface Seller {
  id: string;
  userId: string;
  name: string;
  subdomain: string;
  yupooUrl: string;
  weidianUrl: string;
  whatsapp: string;
  wechat: string;
  ratings: SellerRatings;
  vetStatus: VetStatus;
  vetSummary: string;
  vetSources: RedditThreadRef[];
  vettedAt: number | null;
  notes: string;
  productCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Haul {
  id: string;
  userId: string;
  name: string;
  notes: string;
  status: HaulStatus;
  shippingCostCNY: number;
  agentFeeCNY: number;
  totalCNY: number;
  totalUSD: number;
  productIds: string[];
  shippingMethod: string;
  trackingNumber: string;
  estimatedWeightG: number;
  createdAt: number;
  updatedAt: number;
}

export interface QcPhoto {
  id: string;
  productId: string;
  url: string;
  note: string;
  createdAt: number;
}

/** A saved Reddit thread, attachable to a seller and/or item. */
export interface RedditRef {
  id: string;
  userId: string;
  sellerId: string | null;
  productId: string | null;
  redditId: string;
  permalink: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  snippet: string;
  postedAt: number | null;
  pinned: boolean;
  createdAt: number;
}

/** lightweight thread pointer stored inside seller.vetSources jsonb */
export interface RedditThreadRef {
  permalink: string;
  title: string;
  subreddit: string;
  score: number;
}

export interface UserSettings {
  categories: string[];
  brands: string[];
  exchangeRate: number;
  theme: "light" | "dark";
  preferredAgent: string;
  redditSubs: string[];
}

export interface ScrapeResult {
  title: string;
  description: string;
  images: string[];
  sellerName: string;
  sellerSubdomain: string;
  albumId: string;
  priceCNY: number | null;
  itemUrl: string;
  sourcePlatform: SourcePlatform;
  batch: string | null;
  brand: string | null;
  category: string | null;
  confidence: { title: number; price: number };
}

// ————— configuration —————

export const DEFAULT_CATEGORIES = [
  "Shoes",
  "Bags",
  "Tops",
  "Bottoms",
  "Outerwear",
  "Accessories",
  "Watches",
  "Jewelry",
];
export const DEFAULT_BRANDS = [
  "Nike",
  "Adidas",
  "Louis Vuitton",
  "Gucci",
  "Balenciaga",
  "Off-White",
  "Chrome Hearts",
  "Stone Island",
];
export const DEFAULT_REDDIT_SUBS = [
  "FashionReps",
  "DesignerReps",
  "QualityReps",
  "RepVirgins",
];

export const DEFAULT_SETTINGS: UserSettings = {
  categories: DEFAULT_CATEGORIES,
  brands: DEFAULT_BRANDS,
  exchangeRate: 0.14,
  theme: "dark",
  preferredAgent: "allchinabuy",
  redditSubs: DEFAULT_REDDIT_SUBS,
};

export const TIER_ORDER: Tier[] = ["grail", "cop", "want", "maybe", "pass"];

export const TIER_CONFIG: Record<
  Tier,
  { label: string; token: string; emoji: string; order: number }
> = {
  grail: { label: "Grail", token: "tier-grail", emoji: "👑", order: 0 },
  cop: { label: "Must Cop", token: "tier-cop", emoji: "🔥", order: 1 },
  want: { label: "Want", token: "tier-want", emoji: "⭐", order: 2 },
  maybe: { label: "Maybe", token: "tier-maybe", emoji: "🤔", order: 3 },
  pass: { label: "Pass", token: "tier-pass", emoji: "💤", order: 4 },
};

/** maps legacy haul-manager tier values to the new taxonomy */
export function normalizeTier(raw: string | null | undefined): Tier {
  switch (raw) {
    case "must-cop":
      return "cop";
    case "drop":
      return "pass";
    case "grail":
    case "cop":
    case "want":
    case "maybe":
    case "pass":
      return raw;
    default:
      return "want";
  }
}

export const STATUS_ORDER: ItemStatus[] = [
  "saved",
  "planned",
  "purchased",
  "warehouse",
  "shipped",
  "delivered",
];

export const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; token: string; order: number; hint: string }
> = {
  saved: { label: "Saved", token: "status-saved", order: 0, hint: "In the archive" },
  planned: { label: "In Haul", token: "status-planned", order: 1, hint: "Assigned to a haul" },
  purchased: { label: "Purchased", token: "status-purchased", order: 2, hint: "Ordered via agent" },
  warehouse: { label: "At Warehouse", token: "status-warehouse", order: 3, hint: "QC stage" },
  shipped: { label: "Shipped", token: "status-shipped", order: 4, hint: "On the way to you" },
  delivered: { label: "Delivered", token: "status-delivered", order: 5, hint: "In your hands" },
};

export const HAUL_STATUS_CONFIG: Record<
  HaulStatus,
  { label: string; emoji: string; order: number }
> = {
  planning: { label: "Planning", emoji: "📋", order: 0 },
  ordered: { label: "Ordered", emoji: "🛒", order: 1 },
  shipped: { label: "Shipped", emoji: "📦", order: 2 },
  received: { label: "Received", emoji: "✅", order: 3 },
};

export const VET_CONFIG: Record<
  VetStatus,
  { label: string; token: string; hint: string }
> = {
  unvetted: { label: "Unvetted", token: "vet-unvetted", hint: "No research yet" },
  community: {
    label: "Community Vetted",
    token: "vet-community",
    hint: "Positive Reddit mentions found",
  },
  trusted: { label: "Trusted", token: "vet-trusted", hint: "You've had good experiences" },
  caution: { label: "Caution", token: "vet-caution", hint: "Red flags found — research more" },
};

/** Estimated weights per category in grams (drives shipping estimates). */
export const CATEGORY_WEIGHTS: Record<string, number> = {
  Shoes: 1200,
  Bags: 800,
  Tops: 300,
  Bottoms: 450,
  Outerwear: 900,
  Clothing: 400,
  Accessories: 150,
  Watches: 200,
  Jewelry: 100,
};

export const DEFAULT_ITEM_WEIGHT_G = 400;

export interface ShippingMethod {
  label: string;
  /** CNY for the first 500g (agents bill a base bracket, not linear grams) */
  baseCNY: number;
  /** CNY per additional 100g past 500g */
  perExtra100gCNY: number;
  minDays: number;
  maxDays: number;
  note?: string;
}

/**
 * Guesstimate rate cards modeled on how agent lines actually bill:
 * a first-500g base + per-100g increments. Deliberately estimates, not quotes.
 */
export const SHIPPING_METHODS: Record<string, ShippingMethod> = {
  "us-tax-free": {
    label: "US Tax-Free Line",
    baseCNY: 150,
    perExtra100gCNY: 11,
    minDays: 15,
    maxDays: 30,
    note: "Best value to the US, handles most clothing fine",
  },
  "gd-ems": {
    label: "GD-EMS",
    baseCNY: 160,
    perExtra100gCNY: 12,
    minDays: 10,
    maxDays: 20,
  },
  ems: {
    label: "EMS",
    baseCNY: 180,
    perExtra100gCNY: 14,
    minDays: 10,
    maxDays: 20,
  },
  sal: {
    label: "SAL",
    baseCNY: 100,
    perExtra100gCNY: 9,
    minDays: 20,
    maxDays: 45,
    note: "Cheapest, slowest",
  },
  eub: {
    label: "EUB / e-Packet",
    baseCNY: 130,
    perExtra100gCNY: 10,
    minDays: 15,
    maxDays: 35,
    note: "Small parcels under ~2kg",
  },
  fedex: {
    label: "FedEx IP",
    baseCNY: 220,
    perExtra100gCNY: 19,
    minDays: 5,
    maxDays: 12,
  },
  dhl: {
    label: "DHL",
    baseCNY: 230,
    perExtra100gCNY: 20,
    minDays: 5,
    maxDays: 10,
    note: "Fastest, priciest, strictest",
  },
};

/** Sneaker/clothing batch knowledge — quality tier per known batch code. */
export const BATCH_CONFIG: Record<
  string,
  { label: string; tier: "top" | "mid" | "budget" }
> = {
  LJR: { label: "LJR", tier: "top" },
  GET: { label: "GET", tier: "top" },
  PK: { label: "PK", tier: "top" },
  "PK GOD": { label: "PK GOD", tier: "top" },
  "PK BASF": { label: "PK BASF", tier: "top" },
  OG: { label: "OG", tier: "top" },
  G: { label: "G Batch", tier: "top" },
  H12: { label: "H12", tier: "mid" },
  OWF: { label: "OWF", tier: "mid" },
  GD: { label: "GD", tier: "mid" },
  QY: { label: "QY", tier: "mid" },
  BD: { label: "BD", tier: "mid" },
  Z: { label: "Z Batch", tier: "budget" },
  DT: { label: "DT", tier: "budget" },
  S2: { label: "S2", tier: "budget" },
};

export const BATCH_TIER_CLASS: Record<"top" | "mid" | "budget", string> = {
  top: "text-status-delivered",
  mid: "text-status-warehouse",
  budget: "text-primary",
};
