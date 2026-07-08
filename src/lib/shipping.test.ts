import { describe, expect, it } from "vitest";
import { estimateHaulWeight, estimateItemWeight, estimateShippingCNY, haulCostBreakdown } from "./shipping";

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

describe("shipping cost", () => {
  it("multiplies weight by method rate", () => {
    expect(estimateShippingCNY(2000, "ems")).toBe(160); // 2000g * 0.08
    expect(estimateShippingCNY(0, "ems")).toBe(0);
    expect(estimateShippingCNY(1000, "nope")).toBe(0);
  });
});

describe("haulCostBreakdown", () => {
  const items = [
    { weight: null, category: "Shoes", priceCNY: 499 },
    { weight: null, category: "Outerwear", priceCNY: 328 },
  ];

  it("computes the full breakdown", () => {
    const b = haulCostBreakdown(items, "ems", 30);
    expect(b.itemsCNY).toBe(827);
    expect(b.weightG).toBe(2100);
    expect(b.shippingCNY).toBe(168);
    expect(b.grandTotalCNY).toBe(827 + 168 + 30);
    expect(b.perItemCNY).toBe(Math.round((827 + 168 + 30) / 2));
    expect(b.etaDays).toEqual([10, 20]);
  });

  it("respects a manual shipping override", () => {
    const b = haulCostBreakdown(items, "ems", 0, 245);
    expect(b.shippingCNY).toBe(245);
  });
});
