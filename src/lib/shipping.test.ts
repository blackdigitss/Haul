import { describe, expect, it } from "vitest";
import {
  compareLines,
  estimateHaulWeight,
  estimateItemWeight,
  estimateShippingCNY,
  haulCostBreakdown,
} from "./shipping";

describe("weight estimation", () => {
  it("uses explicit weight when set", () => {
    expect(estimateItemWeight({ weight: 950, category: "Shoes" })).toBe(950);
  });

  it("falls back to category weight then default", () => {
    expect(estimateItemWeight({ weight: null, category: "Shoes" })).toBe(1200);
    expect(estimateItemWeight({ weight: null, category: "Unknown Cat" })).toBe(400);
  });

  it("sums haul weight", () => {
    expect(
      estimateHaulWeight([
        { weight: null, category: "Shoes" },
        { weight: 500, category: "Tops" },
      ])
    ).toBe(1700);
  });
});

describe("tiered shipping cost", () => {
  it("bills the base bracket for anything up to 500g", () => {
    expect(estimateShippingCNY(200, "ems")).toBe(180);
    expect(estimateShippingCNY(500, "ems")).toBe(180);
  });

  it("adds per-100g increments past 500g, rounded up", () => {
    // 2000g = base + ceil(1500/100)=15 increments
    expect(estimateShippingCNY(2000, "ems")).toBe(180 + 15 * 14);
    // 510g rounds up to one increment
    expect(estimateShippingCNY(510, "ems")).toBe(180 + 14);
  });

  it("returns 0 for empty weight or unknown line", () => {
    expect(estimateShippingCNY(0, "ems")).toBe(0);
    expect(estimateShippingCNY(1000, "nope")).toBe(0);
  });
});

describe("compareLines", () => {
  it("sorts by cost and flags cheapest + fastest", () => {
    const quotes = compareLines(2000);
    expect(quotes[0].costCNY).toBeLessThanOrEqual(quotes[quotes.length - 1].costCNY);
    expect(quotes.filter((q) => q.cheapest).length).toBeGreaterThanOrEqual(1);
    const fastest = quotes.find((q) => q.fastest);
    expect(fastest?.key).toBe("dhl");
    expect(quotes.find((q) => q.cheapest)?.key).toBe("sal");
  });
});

describe("haulCostBreakdown", () => {
  const items = [
    { weight: null, category: "Shoes", priceCNY: 499 },
    { weight: null, category: "Outerwear", priceCNY: 328 },
  ];

  it("computes the full breakdown with tiered shipping", () => {
    const b = haulCostBreakdown(items, "ems", 30);
    expect(b.itemsCNY).toBe(827);
    expect(b.weightG).toBe(2100);
    expect(b.shippingCNY).toBe(180 + 16 * 14); // ceil(1600/100)=16
    expect(b.grandTotalCNY).toBe(827 + b.shippingCNY + 30);
    expect(b.etaDays).toEqual([10, 20]);
  });

  it("respects a manual shipping override", () => {
    const b = haulCostBreakdown(items, "ems", 0, 245);
    expect(b.shippingCNY).toBe(245);
  });
});
