import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCNY(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return "just now";
}

export function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

/**
 * Fractional indexing for drag-and-drop reorder.
 * Returns a sort_order value between `before` and `after`.
 */
export function midpoint(before: number, after: number): number {
  return (before + after) / 2;
}

/**
 * Extract seller subdomain from a Yupoo URL.
 * e.g., "https://premium888.x.yupoo.com/albums/123" → "premium888"
 */
export function extractYupooSeller(url: string): string | null {
  const match = url.match(/https?:\/\/([^.]+)\.x\.yupoo\.com/);
  return match ? match[1] : null;
}

/**
 * Build the albums URL from a Yupoo seller subdomain.
 */
export function buildAlbumsUrl(seller: string): string {
  return `https://${seller}.x.yupoo.com/albums`;
}

/**
 * Parse price from a Yupoo title string.
 * Handles: ¥500, ￥500, CNY 500, 500 yuan, (¥100 + ¥50), etc.
 */
export function parseYupooPrice(title: string): number | null {
  // Try math expression first: (¥100 + ¥50)
  const mathMatch = title.match(
    /\(\s*[¥￥]\s*(\d+(?:[.,]\d+)?)\s*\+\s*[¥￥]\s*(\d+(?:[.,]\d+)?)\s*\)/
  );
  if (mathMatch) {
    return parseFloat(mathMatch[1].replace(",", "")) +
      parseFloat(mathMatch[2].replace(",", ""));
  }

  // Standard patterns: ¥500, ￥500
  const symbolMatch = title.match(/[¥￥]\s*(\d+(?:[.,]\d+)?)/);
  if (symbolMatch) {
    return parseFloat(symbolMatch[1].replace(",", ""));
  }

  // Text patterns: CNY 500, 500 yuan, 500 rmb
  const textMatch = title.match(
    /(?:CNY|RMB)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:yuan|rmb|cny)/i
  );
  if (textMatch) {
    const val = textMatch[1] || textMatch[2];
    return parseFloat(val.replace(",", ""));
  }

  return null;
}

/**
 * Validate that a URL is a Yupoo product/album page.
 */
export function isYupooUrl(url: string): boolean {
  return /^https?:\/\/[^.]+\.x\.yupoo\.com\/albums\/\d+/.test(url);
}

/**
 * Validate that a URL is a Weidian product page.
 */
export function isWeidianUrl(url: string): boolean {
  return /weidian\.com\/item\.html/.test(url);
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Calculate the average of seller ratings.
 */
export function averageRating(ratings: object): number {
  const values = (Object.values(ratings) as number[]).filter((v) => typeof v === "number" && v > 0);
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
