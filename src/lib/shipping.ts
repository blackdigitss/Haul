// Haul cost math: weight estimation from categories + per-gram shipping rates.
import type { Item } from "@/types";
import { CATEGORY_WEIGHTS, DEFAULT_ITEM_WEIGHT_G, SHIPPING_METHODS } from "@/types";

export function estimateItemWeight(item: Pick<Item, "weight" | "category">): number {
  if (item.weight && item.weight > 0) return item.weight;
  return CATEGORY_WEIGHTS[item.category] ?? DEFAULT_ITEM_WEIGHT_G;
}

export function estimateHaulWeight(items: Pick<Item, "weight" | "category">[]): number {
  return items.reduce((sum, i) => sum + estimateItemWeight(i), 0);
}

export function estimateShippingCNY(weightG: number, methodKey: string): number {
  const method = SHIPPING_METHODS[methodKey];
  if (!method || weightG <= 0) return 0;
  return Math.round(weightG * method.ratePerGram);
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
