import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, filterItems } from "./filter-items";
import type { Item } from "@/types";

function makeItem(overrides: Partial<Item>): Item {
  return {
    id: Math.random().toString(36),
    userId: "u",
    title: "",
    priceCNY: null,
    priceUSD: null,
    images: [],
    imageUrls: [],
    thumbUrls: [],
    mainImageIndex: 0,
    sellerId: null,
    sellerName: "",
    yupooUrl: "",
    albumId: "",
    itemUrl: "",
    sourcePlatform: "yupoo",
    status: "saved",
    tier: "want",
    rating: 0,
    tags: [],
    category: "",
    brand: "",
    size: "",
    color: "",
    notes: "",
    haulId: null,
    batch: null,
    weight: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

const items = [
  makeItem({ id: "a", title: "Chrome Hearts Hoodie", brand: "Chrome Hearts", tier: "grail", status: "saved", priceCNY: 268, createdAt: 3 }),
  makeItem({ id: "b", title: "Jordan 4 Military", brand: "Jordan", tier: "cop", status: "planned", priceCNY: 499, batch: "LJR", createdAt: 2 }),
  makeItem({ id: "c", title: "Stone Island Overshirt", brand: "Stone Island", tier: "cop", status: "delivered", priceCNY: 328, createdAt: 1 }),
];

describe("filterItems", () => {
  it("returns all items sorted recent-first by default", () => {
    const out = filterItems(items, DEFAULT_FILTERS);
    expect(out.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("multi-term search matches across fields (AND semantics)", () => {
    const out = filterItems(items, { ...DEFAULT_FILTERS, search: "jordan ljr" });
    expect(out.map((i) => i.id)).toEqual(["b"]);
    expect(filterItems(items, { ...DEFAULT_FILTERS, search: "jordan chrome" })).toEqual([]);
  });

  it("filters by tier, status, brand, batch", () => {
    expect(filterItems(items, { ...DEFAULT_FILTERS, tier: "cop" }).length).toBe(2);
    expect(filterItems(items, { ...DEFAULT_FILTERS, status: "delivered" })[0].id).toBe("c");
    expect(filterItems(items, { ...DEFAULT_FILTERS, brand: "Jordan" })[0].id).toBe("b");
    expect(filterItems(items, { ...DEFAULT_FILTERS, batch: "LJR" })[0].id).toBe("b");
  });

  it("sorts by price with nulls last on ascending", () => {
    const withNull = [...items, makeItem({ id: "d", priceCNY: null })];
    const asc = filterItems(withNull, { ...DEFAULT_FILTERS, sort: "price-asc" });
    expect(asc[0].id).toBe("a");
    expect(asc[asc.length - 1].id).toBe("d");
  });

  it("sorts by tier order (grail first)", () => {
    const out = filterItems(items, { ...DEFAULT_FILTERS, sort: "tier" });
    expect(out[0].id).toBe("a");
  });
});
