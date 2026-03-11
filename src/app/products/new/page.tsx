"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Link as LinkIcon,
  Loader2,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import { useToast } from "@/components/ui/toast";
import { useData } from "@/contexts/data-context";
import { cn, isYupooUrl, extractYupooSeller, buildAlbumsUrl, proxyImg } from "@/lib/utils";
import {
  TIER_CONFIG,
  type Tier,
  type ScrapeResult,
} from "@/types";

export default function AddProductPage() {
  return (
    <Suspense>
      <AddProductContent />
    </Suspense>
  );
}

function AddProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createProduct, createSeller, getSellerByUrl, settings, updateSettings } = useData();
  const toast = useToast();
  const autoScraped = useRef(false);

  const categories = settings?.categories || [];
  const styles = settings?.styles || [];
  const brands = settings?.brands || [];

  // URL mode state
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  // Form state
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [name, setName] = useState("");
  const [priceCny, setPriceCny] = useState<number>(0);
  const [priceUsd, setPriceUsd] = useState<number>(0);
  const [category, setCategory] = useState("Other");
  const [style, setStyle] = useState("Other");
  const [tier, setTier] = useState<Tier>("maybe");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [weidianUrl, setWeidianUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleScrape = useCallback(async () => {
    if (!url.trim()) return;
    setScraping(true);
    setScrapeError("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Scrape failed (${res.status})`);
      }

      const data: ScrapeResult = await res.json();

      setName(data.title || "");
      if (data.price_cny) {
        setPriceCny(data.price_cny);
        setPriceUsd(Math.round(data.price_cny * 0.14 * 100) / 100); // Approximate, will be updated
      }
      setImages(data.images.slice(0, 20));
      setSourceUrl(url.trim());
      setSellerName(data.seller_name || "");
      if (data.weidian_url) setWeidianUrl(data.weidian_url);

      // Try to get exchange rate
      try {
        const rateRes = await fetch("/api/exchange-rate");
        if (rateRes.ok) {
          const rateData = await rateRes.json();
          if (data.price_cny && rateData.rate) {
            setPriceUsd(
              Math.round(data.price_cny * rateData.rate * 100) / 100
            );
          }
        }
      } catch {
        // Use approximate rate
      }
    } catch (err) {
      setScrapeError(
        err instanceof Error ? err.message : "Failed to scrape URL"
      );
    } finally {
      setScraping(false);
    }
  }, [url]);

  // Auto-scrape if URL query param is present (from clipboard prompt)
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && !autoScraped.current) {
      autoScraped.current = true;
      setUrl(urlParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (url && autoScraped.current && !scraping && !name) {
      handleScrape();
    }
  }, [url, scraping, name, handleScrape]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      setSaving(true);
      setSaveError("");

      try {
        // Find or create seller
        let sellerId = "";
        let finalSellerName = sellerName || "Unknown";

        if (sourceUrl) {
          const existingSeller = getSellerByUrl(sourceUrl);
          if (existingSeller) {
            sellerId = existingSeller.id;
            finalSellerName = existingSeller.name;
          } else {
            const sellerSubdomain = extractYupooSeller(sourceUrl);
            if (sellerSubdomain) {
              const newSeller = await createSeller({
                name: sellerName || sellerSubdomain,
                yupoo_url: `https://${sellerSubdomain}.x.yupoo.com`,
                albums_url: buildAlbumsUrl(sellerSubdomain),
                contact: {},
                ratings: {
                  quality: 0,
                  accuracy: 0,
                  communication: 0,
                  shipping_speed: 0,
                  value: 0,
                },
                notes: "",
                product_count: 0,
              });
              sellerId = newSeller.id;
              finalSellerName = newSeller.name;
            }
          }
        }

        // Auto-save new brand to settings
        const trimmedBrand = brand.trim();
        if (trimmedBrand && !brands.includes(trimmedBrand)) {
          await updateSettings({ brands: [...brands, trimmedBrand] });
        }

        await createProduct({
          name: name.trim(),
          brand: trimmedBrand || "",
          price_cny: priceCny,
          price_usd: priceUsd,
          source_url: sourceUrl,
          weidian_url: weidianUrl.trim() || "",
          images: [],
          original_images: images,
          category,
          style,
          seller_id: sellerId,
          seller_name: finalSellerName,
          rating,
          notes,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          tier,
          sort_order: Date.now(),
          status: "saved",
        });

        toast.success("Product saved!");
        router.push("/products");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save product";
        setSaveError(msg);
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    },
    [
      name, brand, brands, priceCny, priceUsd, sourceUrl, weidianUrl, images, category,
      style, sellerName, rating, notes, tags, tier,
      createProduct, createSeller, getSellerByUrl, updateSettings, router, toast,
    ]
  );

  return (
    <AppShell>
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-6">Add Product</h1>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-secondary)] w-fit mb-6">
        <button
          onClick={() => setMode("url")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
            mode === "url"
              ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          <LinkIcon size={14} className="inline mr-1.5 -mt-0.5" />
          Paste URL
        </button>
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
            mode === "manual"
              ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Plus size={14} className="inline mr-1.5 -mt-0.5" />
          Manual Entry
        </button>
      </div>

      <div className="max-w-2xl">
        {/* URL Scrape Section */}
        <AnimatePresence mode="wait">
          {mode === "url" && (
            <motion.div
              key="url"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Paste Yupoo or Weidian URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleScrape();
                      }
                    }}
                    icon={<LinkIcon size={14} />}
                  />
                </div>
                <Button
                  onClick={handleScrape}
                  disabled={scraping || !url.trim()}
                >
                  {scraping ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Extract
                    </>
                  )}
                </Button>
              </div>
              {scrapeError && (
                <p className="text-xs text-red-400 mt-2">{scrapeError}</p>
              )}
              {!isYupooUrl(url) && url.trim() && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Tip: Paste a full Yupoo album URL for best results
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scraped images preview */}
        {images.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
              Images ({images.length})
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proxyImg(img)}
                    alt={`Image ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <button
                    onClick={() =>
                      setImages(images.filter((_, idx) => idx !== i))
                    }
                    className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Product Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Miu Miu Wool Coat"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Brand
            </label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Nike, Louis Vuitton..."
              list="brand-list"
            />
            {brands.length > 0 && (
              <datalist id="brand-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Price (CNY)
              </label>
              <Input
                type="number"
                min="0"
                value={priceCny || ""}
                onChange={(e) => setPriceCny(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Price (USD)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={priceUsd || ""}
                onChange={(e) => setPriceUsd(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Seller
            </label>
            <Input
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Seller name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categories.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Style
              </label>
              <Select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                options={styles.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Priority
              </label>
              <Select
                value={tier}
                onChange={(e) => setTier(e.target.value as Tier)}
                options={(Object.keys(TIER_CONFIG) as Tier[]).map((t) => ({
                  value: t,
                  label: TIER_CONFIG[t].label,
                }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Rating
              </label>
              <StarRating value={rating} onChange={setRating} size={20} />
            </div>
          </div>

          {mode === "manual" && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Source URL
              </label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Weidian URL (optional)
            </label>
            <Input
              value={weidianUrl}
              onChange={(e) => setWeidianUrl(e.target.value)}
              placeholder="https://weidian.com/item.html?..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this product..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Tags (comma separated)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="designer, winter, grail..."
            />
          </div>

          {saveError && (
            <p className="text-xs text-red-400">{saveError}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Save Product
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
