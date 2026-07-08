// Pure filter/sort logic for the Items grid — extracted so it's unit-testable
// and reusable (the detail page's swipe order reuses the exact same result).
import type { Item, ItemStatus, Tier } from "@/types";
import { STATUS_CONFIG, TIER_CONFIG } from "@/types";

export interface ItemFilters {
  search: string;
  tier: Tier | "all";
  status: ItemStatus | "all";
  category: string;
  brand: string;
  batch: string;
  sellerId: string;
  sort: SortKey;
}

export type SortKey =
  | "recent"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "tier"
  | "status"
  | "title";

export const DEFAULT_FILTERS: ItemFilters = {
  search: "",
  tier: "all",
  status: "all",
  category: "",
  brand: "",
  batch: "",
  sellerId: "",
  sort: "recent",
};

export function filterItems(items: Item[], f: ItemFilters): Item[] {
  let out = items;

  if (f.search.trim()) {
    const terms = f.search.toLowerCase().split(/\s+/).filter(Boolean);
    out = out.filter((i) => {
      const hay = `${i.title} ${i.brand} ${i.sellerName} ${i.batch ?? ""} ${i.category} ${i.tags.join(" ")} ${i.notes}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  if (f.tier !== "all") out = out.filter((i) => i.tier === f.tier);
  if (f.status !== "all") out = out.filter((i) => i.status === f.status);
  if (f.category) out = out.filter((i) => i.category === f.category);
  if (f.brand) out = out.filter((i) => i.brand === f.brand);
  if (f.batch) out = out.filter((i) => i.batch === f.batch);
  if (f.sellerId) out = out.filter((i) => i.sellerId === f.sellerId);

  const sorted = [...out];
  switch (f.sort) {
    case "recent":
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "oldest":
      sorted.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case "price-asc":
      sorted.sort((a, b) => (a.priceCNY ?? Infinity) - (b.priceCNY ?? Infinity));
      break;
    case "price-desc":
      sorted.sort((a, b) => (b.priceCNY ?? -1) - (a.priceCNY ?? -1));
      break;
    case "tier":
      sorted.sort(
        (a, b) =>
          TIER_CONFIG[a.tier].order - TIER_CONFIG[b.tier].order || b.createdAt - a.createdAt
      );
      break;
    case "status":
      sorted.sort(
        (a, b) =>
          STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order ||
          b.createdAt - a.createdAt
      );
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return sorted;
}

export function hasActiveFilters(f: ItemFilters): boolean {
  return (
    f.search !== "" ||
    f.tier !== "all" ||
    f.status !== "all" ||
    f.category !== "" ||
    f.brand !== "" ||
    f.batch !== "" ||
    f.sellerId !== ""
  );
}
