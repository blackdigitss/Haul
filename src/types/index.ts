// ============================================================
// Haul App — Core Type Definitions
// ============================================================

export type Tier = "must-cop" | "high" | "medium" | "low" | "maybe";

export type ProductStatus =
  | "saved"
  | "in-haul"
  | "ordered"
  | "shipped"
  | "received";

export type HaulStatus = "planning" | "ordered" | "shipped" | "received";

// ---- Seller ----

export interface SellerRatings {
  quality: number; // 1-5
  accuracy: number; // 1-5
  communication: number; // 1-5
  shipping_speed: number; // 1-5
  value: number; // 1-5
}

export interface SellerContact {
  whatsapp?: string;
  wechat?: string;
  other?: string;
}

export interface Seller {
  id: string;
  name: string;
  yupoo_url: string;
  albums_url: string;
  weidian_url?: string;
  contact: SellerContact;
  ratings: SellerRatings;
  notes: string;
  product_count: number;
  avatar_url?: string;
  created_at: number;
  updated_at: number;
}

// ---- Product ----

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price_cny: number;
  price_usd: number;
  source_url: string;
  weidian_url?: string;
  images: string[]; // Firebase Storage URLs (cached)
  original_images: string[]; // Original source URLs
  category: string;
  style: string;
  seller_id: string;
  seller_name: string; // Denormalized for display
  rating: number; // 1-5
  notes: string;
  tags: string[];
  haul_id?: string;
  tier: Tier;
  sort_order: number;
  status: ProductStatus;
  created_at: number;
  updated_at: number;
}

// ---- Haul ----

export interface Haul {
  id: string;
  name: string;
  status: HaulStatus;
  total_cny: number;
  total_usd: number;
  product_ids: string[];
  notes: string;
  shipping_agent?: string;
  tracking_number?: string;
  created_at: number;
  updated_at: number;
}

// ---- User Settings ----

export interface UserSettings {
  categories: string[];
  styles: string[];
  brands: string[];
  preferred_currency: string;
  theme: "light" | "dark" | "system";
}

// ---- Scrape Result ----

export interface ScrapeResult {
  title: string;
  price_cny: number | null;
  images: string[];
  seller_name: string;
  seller_url: string;
  albums_url: string;
  subtitle?: string;
  weidian_url?: string;
  contact: SellerContact;
}

// ---- Filter State ----

export interface ProductFilters {
  search: string;
  categories: string[];
  styles: string[];
  sellers: string[];
  tier: Tier | null;
  status: ProductStatus | null;
  rating_min: number;
  price_min: number;
  price_max: number;
  sort_by: SortOption;
  sort_dir: "asc" | "desc";
}

export type SortOption =
  | "created_at"
  | "price_usd"
  | "rating"
  | "name"
  | "tier"
  | "sort_order";

// ---- Constants ----

export const DEFAULT_CATEGORIES = [
  "Shoes",
  "Bags",
  "Clothing",
  "Outerwear",
  "Jewelry",
  "Watches",
  "Accessories",
  "Sunglasses",
  "Belts",
  "Scarves",
  "Tech",
  "Home",
  "Other",
] as const;

export const DEFAULT_BRANDS: string[] = [];

export const DEFAULT_STYLES = [
  "Luxury",
  "Streetwear",
  "Casual",
  "Sportswear",
  "Vintage",
  "Minimalist",
  "Avant-Garde",
  "Workwear",
  "Formal",
  "Other",
] as const;

export const TIER_CONFIG: Record<
  Tier,
  { label: string; color: string; bg: string; order: number }
> = {
  "must-cop": {
    label: "Must Cop",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    order: 0,
  },
  high: {
    label: "High",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    order: 1,
  },
  medium: {
    label: "Medium",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    order: 2,
  },
  low: {
    label: "Low",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10 border-zinc-500/20",
    order: 3,
  },
  maybe: {
    label: "Maybe",
    color: "text-zinc-500",
    bg: "bg-zinc-500/5 border-zinc-500/10",
    order: 4,
  },
};

export const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; color: string; icon: string }
> = {
  saved: { label: "Saved", color: "text-zinc-400", icon: "bookmark" },
  "in-haul": { label: "In Haul", color: "text-sky-400", icon: "shopping-bag" },
  ordered: { label: "Ordered", color: "text-amber-400", icon: "package" },
  shipped: { label: "Shipped", color: "text-violet-400", icon: "truck" },
  received: { label: "Received", color: "text-emerald-400", icon: "check-circle" },
};

export const HAUL_STATUS_CONFIG: Record<
  HaulStatus,
  { label: string; color: string }
> = {
  planning: { label: "Planning", color: "text-zinc-400" },
  ordered: { label: "Ordered", color: "text-amber-400" },
  shipped: { label: "Shipped", color: "text-violet-400" },
  received: { label: "Received", color: "text-emerald-400" },
};

export const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  categories: [],
  styles: [],
  sellers: [],
  tier: null,
  status: null,
  rating_min: 0,
  price_min: 0,
  price_max: 10000,
  sort_by: "created_at",
  sort_dir: "desc",
};
