// Data ownership: full JSON backup + items CSV export.
import type { Haul, Item, RedditRef, Seller, UserSettings } from "@/types";

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function itemsToCSV(items: Item[]): string {
  return toCSV(
    items.map((i) => ({
      title: i.title,
      brand: i.brand,
      category: i.category,
      tier: i.tier,
      status: i.status,
      price_cny: i.priceCNY ?? "",
      price_usd: i.priceUSD ?? "",
      batch: i.batch ?? "",
      size: i.size,
      seller: i.sellerName,
      yupoo_url: i.yupooUrl,
      item_url: i.itemUrl,
      rating: i.rating || "",
      tags: i.tags.join("; "),
      notes: i.notes,
      created: new Date(i.createdAt).toISOString().slice(0, 10),
    }))
  );
}

export function fullBackup(data: {
  items: Item[];
  sellers: Seller[];
  hauls: Haul[];
  redditRefs: RedditRef[];
  settings: UserSettings;
}): string {
  return JSON.stringify(
    { app: "haul", version: 2, exportedAt: new Date().toISOString(), ...data },
    null,
    2
  );
}
