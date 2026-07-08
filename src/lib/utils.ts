import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** Hosts whose images are hotlink-protected and must go through the img-proxy. */
const PROXIED_HOSTS = ["yupoo.com", "weidian.com", "wdcdn.net", "alicdn.com"];

/**
 * Rewrites hotlink-protected image URLs through the img-proxy edge function
 * (spoofs the Referer server-side) so they render in the app.
 */
export function proxyImg(url: string | undefined | null): string {
  if (!url) return "";
  if (PROXIED_HOSTS.some((h) => url.includes(h))) {
    return `${SUPABASE_URL}/functions/v1/img-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Best available image for an item:
 * permanent thumbnail → permanent original → proxied source fallback.
 */
export function itemThumb(p: {
  thumbUrls?: string[];
  imageUrls?: string[];
  images?: string[];
  mainImageIndex?: number;
}): string {
  const i = p.mainImageIndex ?? 0;
  const thumb = p.thumbUrls?.[i] || p.thumbUrls?.[0];
  if (thumb) return thumb;
  const full = p.imageUrls?.[i] || p.imageUrls?.[0];
  if (full) return full;
  const fallback = p.images?.[i] || p.images?.[0];
  return proxyImg(fallback);
}

export function itemFull(
  p: { imageUrls?: string[]; images?: string[]; mainImageIndex?: number },
  index?: number
): string {
  const i = index ?? p.mainImageIndex ?? 0;
  return p.imageUrls?.[i] || proxyImg(p.images?.[i]);
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatCNY(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night moves";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
