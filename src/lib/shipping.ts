// Haul cost math: category-based weight estimation + tiered line rates
// (first-500g base + per-100g increments, the way agent rate cards bill).
import type { Item } from "@/types";
import { CATEGORY_WEIGHTS, DEFAULT_ITEM_WEIGHT_G, SHIPPING_METHODS } from "@/types";

export function estimateItemWeight(item: Pick<Item, "weight" | "category">): number {
  if (item.weight && item.weight > 0) return item.weight;
  return CATEGORY_WEIGHTS[item.category] ?? DEFAULT_ITEM_WEIGHT_G;
}

export function estimateHaulWeight(items: Pick<Item, "weight" | "category">[]): number {
  return items.reduce((sum, i) => sum + estimateItemWeight(i), 0);
}

/** Tiered estimate: base covers the first 500g, then per-100g increments. */
export function estimateShippingCNY(weightG: number, methodKey: string): number {
  const method = SHIPPING_METHODS[methodKey];
  if (!method || weightG <= 0) return 0;
  const billed = Math.max(weightG, 500);
  const extraUnits = Math.ceil((billed - 500) / 100);
  return method.baseCNY + extraUnits * method.perExtra100gCNY;
}

export interface LineQuote {
  key: string;
  label: string;
  costCNY: number;
  minDays: number;
  maxDays: number;
  note?: string;
  cheapest: boolean;
  fastest: boolean;
}

/** Every line priced for this weight, cheapest & fastest flagged. */
export function compareLines(weightG: number): LineQuote[] {
  const quotes = Object.entries(SHIPPING_METHODS).map(([key, m]) => ({
    key,
    label: m.label,
    costCNY: estimateShippingCNY(weightG, key),
    minDays: m.minDays,
    maxDays: m.maxDays,
    note: m.note,
    cheapest: false,
    fastest: false,
  }));
  if (weightG > 0 && quotes.length > 0) {
    const minCost = Math.min(...quotes.map((q) => q.costCNY));
    const minEta = Math.min(...quotes.map((q) => q.maxDays));
    for (const q of quotes) {
      q.cheapest = q.costCNY === minCost;
      q.fastest = q.maxDays === minEta;
    }
  }
  return quotes.sort((a, b) => a.costCNY - b.costCNY);
}

export interface HaulCostBreakdown {
  itemsCNY: number;
  weightG: number;
  shippingCNY: number;
  agentFeeCNY: number;
  grandTotalCNY: number;
  perItemCNY: number;
  perKgCNY: number;
  etaDays: [number, number] | null;
}

export function haulCostBreakdown(
  items: Pick<Item, "weight" | "category" | "priceCNY">[],
  methodKey: string,
  agentFeeCNY: number,
  shippingOverrideCNY?: number
): HaulCostBreakdown {
  const itemsCNY = items.reduce((sum, i) => sum + (i.priceCNY || 0), 0);
  const weightG = estimateHaulWeight(items);
  const shippingCNY =
    shippingOverrideCNY && shippingOverrideCNY > 0
      ? shippingOverrideCNY
      : estimateShippingCNY(weightG, methodKey);
  const grandTotalCNY = itemsCNY + shippingCNY + agentFeeCNY;
  const method = SHIPPING_METHODS[methodKey];
  return {
    itemsCNY,
    weightG,
    shippingCNY,
    agentFeeCNY,
    grandTotalCNY,
    perItemCNY: items.length > 0 ? Math.round(grandTotalCNY / items.length) : 0,
    perKgCNY: weightG > 0 ? Math.round(grandTotalCNY / (weightG / 1000)) : 0,
    etaDays: method ? [method.minDays, method.maxDays] : null,
  };
}
