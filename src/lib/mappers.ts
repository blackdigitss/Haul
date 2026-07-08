// Row ↔ domain mapping. The DB keeps haul-manager's snake_case columns
// (so existing data carries over); the app speaks the camelCase domain types.
import type { Haul, Item, QcPhoto, RedditRef, Seller, UserSettings } from "@/types";
import { DEFAULT_SETTINGS, normalizeTier } from "@/types";

// deno-lint-ignore-file
/* eslint-disable @typescript-eslint/no-explicit-any */

const ts = (v: any): number => (v ? new Date(v).getTime() : Date.now());

export function mapItem(row: any): Item {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? "",
    priceCNY: row.price_cny != null ? Number(row.price_cny) : null,
    priceUSD: row.price_usd != null ? Number(row.price_usd) : null,
    images: row.images ?? [],
    imageUrls: row.image_urls ?? [],
    thumbUrls: row.thumb_urls ?? [],
    mainImageIndex: row.main_image_index ?? 0,
    sellerId: row.seller_id ?? null,
    sellerName: row.seller_name ?? "",
    yupooUrl: row.yupoo_url ?? "",
    albumId: row.album_id ?? "",
    itemUrl: row.item_url ?? "",
    sourcePlatform: row.source_platform ?? "yupoo",
    status: row.status ?? "saved",
    tier: normalizeTier(row.tier),
    rating: row.rating ?? 0,
    tags: row.tags ?? [],
    category: row.category ?? "",
    brand: row.brand ?? "",
    size: row.size ?? "",
    color: row.color ?? "",
    notes: row.notes ?? "",
    haulId: row.haul_id ?? null,
    batch: row.batch ?? null,
    weight: row.weight != null ? Number(row.weight) : null,
    createdAt: ts(row.created_at),
    updatedAt: ts(row.updated_at),
  };
}

export function itemToRow(item: Partial<Item>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (item.title !== undefined) row.title = item.title;
  if (item.priceCNY !== undefined) row.price_cny = item.priceCNY;
  if (item.priceUSD !== undefined) row.price_usd = item.priceUSD;
  if (item.images !== undefined) row.images = item.images;
  if (item.imageUrls !== undefined) row.image_urls = item.imageUrls;
  if (item.thumbUrls !== undefined) row.thumb_urls = item.thumbUrls;
  if (item.mainImageIndex !== undefined) row.main_image_index = item.mainImageIndex;
  if (item.sellerId !== undefined) row.seller_id = item.sellerId;
  if (item.sellerName !== undefined) row.seller_name = item.sellerName;
  if (item.yupooUrl !== undefined) row.yupoo_url = item.yupooUrl;
  if (item.albumId !== undefined) row.album_id = item.albumId;
  if (item.itemUrl !== undefined) row.item_url = item.itemUrl;
  if (item.sourcePlatform !== undefined) row.source_platform = item.sourcePlatform;
  if (item.status !== undefined) row.status = item.status;
  if (item.tier !== undefined) row.tier = item.tier;
  if (item.rating !== undefined) row.rating = item.rating;
  if (item.tags !== undefined) row.tags = item.tags;
  if (item.category !== undefined) row.category = item.category;
  if (item.brand !== undefined) row.brand = item.brand;
  if (item.size !== undefined) row.size = item.size;
  if (item.color !== undefined) row.color = item.color;
  if (item.notes !== undefined) row.notes = item.notes;
  if (item.haulId !== undefined) row.haul_id = item.haulId;
  if (item.batch !== undefined) row.batch = item.batch;
  if (item.weight !== undefined) row.weight = item.weight;
  return row;
}

export function mapSeller(row: any): Seller {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? "",
    subdomain: row.subdomain ?? "",
    yupooUrl: row.yupoo_url ?? "",
    weidianUrl: row.weidian_url ?? "",
    whatsapp: row.whatsapp ?? "",
    wechat: row.wechat ?? "",
    ratings: {
      quality: row.rating_quality ?? 0,
      accuracy: row.rating_accuracy ?? 0,
      communication: row.rating_communication ?? 0,
      shipping: row.rating_shipping ?? 0,
      value: row.rating_value ?? 0,
    },
    vetStatus: row.vet_status ?? "unvetted",
    vetSummary: row.vet_summary ?? "",
    vetSources: row.vet_sources ?? [],
    vettedAt: row.vetted_at ? ts(row.vetted_at) : null,
    notes: row.notes ?? "",
    productCount: row.product_count ?? 0,
    createdAt: ts(row.created_at),
    updatedAt: ts(row.updated_at),
  };
}

export function sellerToRow(s: Partial<Seller>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.subdomain !== undefined) row.subdomain = s.subdomain;
  if (s.yupooUrl !== undefined) row.yupoo_url = s.yupooUrl;
  if (s.weidianUrl !== undefined) row.weidian_url = s.weidianUrl;
  if (s.whatsapp !== undefined) row.whatsapp = s.whatsapp;
  if (s.wechat !== undefined) row.wechat = s.wechat;
  if (s.notes !== undefined) row.notes = s.notes;
  if (s.vetStatus !== undefined) row.vet_status = s.vetStatus;
  if (s.vetSummary !== undefined) row.vet_summary = s.vetSummary;
  if (s.ratings !== undefined) {
    row.rating_quality = s.ratings.quality;
    row.rating_accuracy = s.ratings.accuracy;
    row.rating_communication = s.ratings.communication;
    row.rating_shipping = s.ratings.shipping;
    row.rating_value = s.ratings.value;
  }
  return row;
}

export function mapHaul(row: any): Haul {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? "",
    notes: row.notes ?? "",
    status: row.status ?? "planning",
    shippingCostCNY: Number(row.shipping_cost_cny ?? 0),
    agentFeeCNY: Number(row.agent_fee_cny ?? 0),
    totalCNY: Number(row.total_cny ?? 0),
    totalUSD: Number(row.total_usd ?? 0),
    productIds: row.product_ids ?? [],
    shippingMethod: row.shipping_method ?? "",
    trackingNumber: row.tracking_number ?? "",
    estimatedWeightG: Number(row.estimated_weight_g ?? 0),
    createdAt: ts(row.created_at),
    updatedAt: ts(row.updated_at),
  };
}

export function haulToRow(h: Partial<Haul>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (h.name !== undefined) row.name = h.name;
  if (h.notes !== undefined) row.notes = h.notes;
  if (h.status !== undefined) row.status = h.status;
  if (h.shippingCostCNY !== undefined) row.shipping_cost_cny = h.shippingCostCNY;
  if (h.agentFeeCNY !== undefined) row.agent_fee_cny = h.agentFeeCNY;
  if (h.totalCNY !== undefined) row.total_cny = h.totalCNY;
  if (h.totalUSD !== undefined) row.total_usd = h.totalUSD;
  if (h.productIds !== undefined) row.product_ids = h.productIds;
  if (h.shippingMethod !== undefined) row.shipping_method = h.shippingMethod;
  if (h.trackingNumber !== undefined) row.tracking_number = h.trackingNumber;
  if (h.estimatedWeightG !== undefined) row.estimated_weight_g = h.estimatedWeightG;
  return row;
}

export function mapRedditRef(row: any): RedditRef {
  return {
    id: row.id,
    userId: row.user_id,
    sellerId: row.seller_id ?? null,
    productId: row.product_id ?? null,
    redditId: row.reddit_id ?? "",
    permalink: row.permalink ?? "",
    title: row.title ?? "",
    subreddit: row.subreddit ?? "",
    author: row.author ?? "",
    score: row.score ?? 0,
    numComments: row.num_comments ?? 0,
    snippet: row.snippet ?? "",
    postedAt: row.posted_at ? ts(row.posted_at) : null,
    pinned: row.pinned ?? false,
    createdAt: ts(row.created_at),
  };
}

export function mapQcPhoto(row: any): QcPhoto {
  return {
    id: row.id,
    productId: row.product_id,
    url: row.url ?? "",
    note: row.note ?? "",
    createdAt: ts(row.created_at),
  };
}

export function mapSettings(row: any): UserSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    categories: row.categories ?? DEFAULT_SETTINGS.categories,
    brands: row.brands ?? DEFAULT_SETTINGS.brands,
    exchangeRate: Number(row.exchange_rate ?? DEFAULT_SETTINGS.exchangeRate),
    theme: row.theme === "light" ? "light" : "dark",
    preferredAgent: row.preferred_agent ?? DEFAULT_SETTINGS.preferredAgent,
    redditSubs: row.reddit_subs ?? DEFAULT_SETTINGS.redditSubs,
  };
}
