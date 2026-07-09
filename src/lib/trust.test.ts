import { describe, expect, it } from "vitest";
import { categoryStrengths, trustScore } from "./trust";
import type { SellerRatings } from "@/types";

const noRatings: SellerRatings = { quality: 0, accuracy: 0, communication: 0, shipping: 0, value: 0 };
const highRatings: SellerRatings = { quality: 5, accuracy: 4, communication: 5, shipping: 4, value: 5 };

describe("trustScore", () => {
  it("scores a fresh unvetted seller as unproven-ish", () => {
    const t = trustScore({ vetStatus: "unvetted", ratings: noRatings, vettedAt: null }, [], 0);
    expect(t.score).toBe(15);
    expect(t.band).toBe("risky");
  });

  it("stacks community vetting, ratings, deliveries, and research", () => {
    const t = trustScore(
      { vetStatus: "community", ratings: highRatings, vettedAt: Date.now() },
      [
        { status: "delivered", rating: 5 },
        { status: "delivered", rating: 4 },
        { status: "saved", rating: 0 },
      ],
      3
    );
    // 35 + round(4.6/5*25)=23 + 12 + 12 = 82
    expect(t.score).toBe(82);
    expect(t.band).toBe("solid");
    expect(t.signals.length).toBeGreaterThan(0);
  });

  it("caps caution sellers regardless of other signals", () => {
    const t = trustScore(
      { vetStatus: "caution", ratings: highRatings, vettedAt: Date.now() },
      [{ status: "delivered", rating: 5 }],
      5
    );
    expect(t.score).toBeLessThanOrEqual(25);
    expect(t.band).toBe("risky");
  });

  it("never exceeds 100", () => {
    const many = Array.from({ length: 10 }, () => ({ status: "delivered" as const, rating: 5 }));
    const t = trustScore(
      { vetStatus: "trusted", ratings: highRatings, vettedAt: Date.now() },
      many,
      10
    );
    expect(t.score).toBeLessThanOrEqual(100);
    expect(t.band).toBe("solid");
  });
});

describe("categoryStrengths", () => {
  it("surfaces categories with real evidence, strongest first", () => {
    const strengths = categoryStrengths([
      { category: "Tops", status: "delivered", rating: 5 },
      { category: "Tops", status: "saved", rating: 0 },
      { category: "Outerwear", status: "delivered", rating: 4 },
      { category: "Shoes", status: "saved", rating: 0 }, // weight 1 — filtered out
    ]);
    expect(strengths[0]).toBe("Tops");
    expect(strengths).toContain("Outerwear");
    expect(strengths).not.toContain("Shoes");
  });

  it("returns empty for no evidence", () => {
    expect(categoryStrengths([])).toEqual([]);
  });
});
