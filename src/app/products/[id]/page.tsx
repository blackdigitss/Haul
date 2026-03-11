"use client";

import { useState, useMemo, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  Package,
  Star,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { PageLoader } from "@/components/ui/loading";
import { Lightbox } from "@/components/ui/lightbox";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useData } from "@/contexts/data-context";
import { cn, formatUSD, formatCNY, proxyImg } from "@/lib/utils";
import {
  TIER_CONFIG,
  STATUS_CONFIG,
  type Tier,
  type ProductStatus,
  type Product,
} from "@/types";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { products, sellers, settings, updateProduct, deleteProduct, updateSettings } = useData();
  const product = useMemo(
    () => products.find((p) => p.id === id),
    [products, id]
  );

  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const seller = useMemo(
    () => product && sellers.find((s) => s.id === product.seller_id),
    [product, sellers]
  );

  const brands = settings?.brands || [];

  const handleSetMainImage = useCallback(async (index: number) => {
    if (!product) return;
    const imgs = product.images.length > 0 ? [...product.images] : [...(product.original_images || [])];
    if (index <= 0 || index >= imgs.length) return;
    const [selected] = imgs.splice(index, 1);
    imgs.unshift(selected);
    const updateField = product.images.length > 0 ? "images" : "original_images";
    await updateProduct(product.id, { [updateField]: imgs });
    setActiveImage(0);
    toast.success("Main image updated");
  }, [product, updateProduct, toast]);

  const startEdit = useCallback(() => {
    if (!product) return;
    setForm({
      name: product.name,
      brand: product.brand || "",
      price_cny: product.price_cny,
      price_usd: product.price_usd,
      category: product.category,
      style: product.style,
      tier: product.tier,
      status: product.status,
      rating: product.rating,
      notes: product.notes,
      tags: product.tags,
    });
    setEditing(true);
  }, [product]);

  const handleSave = useCallback(async () => {
    if (!product) return;
    setSaving(true);
    try {
      // Auto-save new brand to settings
      const trimmedBrand = (form.brand || "").trim();
      if (trimmedBrand && !brands.includes(trimmedBrand)) {
        await updateSettings({ brands: [...brands, trimmedBrand] });
      }
      await updateProduct(product.id, { ...form, brand: trimmedBrand || "" });
      setEditing(false);
      toast.success("Product updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }, [product, form, brands, updateProduct, updateSettings, toast]);

  const handleDelete = useCallback(async () => {
    if (!product) return;
    const ok = await confirm({
      title: "Delete Product",
      message: "This product will be permanently deleted.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    await deleteProduct(product.id);
    router.push("/products");
  }, [product, deleteProduct, router, confirm]);

  if (!product) return (
    <AppShell>
      <div className="text-center py-20">
        <Package size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Product not found</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">This product may have been deleted.</p>
        <Link href="/products" className="text-sm text-[var(--accent)] hover:underline">
          Back to Products
        </Link>
      </div>
    </AppShell>
  );

  const rawImages = product.images.length > 0 ? product.images : (product.original_images || []);
  const images = rawImages.map(proxyImg);
  const categories = settings?.categories || [];
  const styles = settings?.styles || [];

  return (
    <AppShell>
      {/* Back nav */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="max-w-md mx-auto lg:max-w-none">
          <div className="relative aspect-[4/3] lg:aspect-square max-h-[60vh] rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)]">
            {images.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full h-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[activeImage]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package size={48} className="text-[var(--text-muted)]" />
              </div>
            )}

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImage((i) => (i - 1 + images.length) % images.length)
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    setActiveImage((i) => (i + 1) % images.length)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === activeImage
                          ? "bg-white scale-110"
                          : "bg-white/40 hover:bg-white/60"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <div key={i} className="relative group flex-shrink-0">
                  <button
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      i === activeImage
                        ? "border-[var(--accent)] opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                  {i > 0 && (
                    <button
                      onClick={() => handleSetMainImage(i)}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Set as main image"
                    >
                      <Star size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Name
                </label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Brand
                </label>
                <Input
                  value={form.brand || ""}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. Nike, Louis Vuitton..."
                  list="brand-list-edit"
                />
                {brands.length > 0 && (
                  <datalist id="brand-list-edit">
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
                    value={form.price_cny || 0}
                    onChange={(e) =>
                      setForm({ ...form, price_cny: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                    Price (USD)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price_usd || 0}
                    onChange={(e) =>
                      setForm({ ...form, price_usd: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                    Category
                  </label>
                  <Select
                    value={form.category || ""}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    options={categories.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                    Style
                  </label>
                  <Select
                    value={form.style || ""}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
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
                    value={form.tier || "maybe"}
                    onChange={(e) => setForm({ ...form, tier: e.target.value as Tier })}
                    options={(Object.keys(TIER_CONFIG) as Tier[]).map((t) => ({
                      value: t,
                      label: TIER_CONFIG[t].label,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                    Status
                  </label>
                  <Select
                    value={form.status || "saved"}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as ProductStatus })
                    }
                    options={(Object.keys(STATUS_CONFIG) as ProductStatus[]).map((s) => ({
                      value: s,
                      label: STATUS_CONFIG[s].label,
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Rating
                </label>
                <StarRating
                  value={form.rating || 0}
                  onChange={(v) => setForm({ ...form, rating: v })}
                  size={20}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Notes
                </label>
                <Textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Tags (comma separated)
                </label>
                <Input
                  value={(form.tags || []).join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="designer, winter, grail..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save size={14} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className={cn(
                      "border font-semibold",
                      TIER_CONFIG[product.tier].bg,
                      TIER_CONFIG[product.tier].color
                    )}
                  >
                    {TIER_CONFIG[product.tier].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={STATUS_CONFIG[product.status].color}
                  >
                    {STATUS_CONFIG[product.status].label}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-0.5">
                    {product.brand}
                  </p>
                )}
                {seller && (
                  <Link
                    href={`/sellers/${seller.id}`}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    by {seller.name}
                  </Link>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight">
                  {formatUSD(product.price_usd)}
                </span>
                <span className="text-lg text-[var(--text-muted)]">
                  {formatCNY(product.price_cny)}
                </span>
              </div>

              {/* Rating */}
              {product.rating > 0 && (
                <StarRating value={product.rating} readonly size={20} />
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-2">
                <Badge>{product.category}</Badge>
                {product.style && product.style !== "Other" && (
                  <Badge variant="outline">{product.style}</Badge>
                )}
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Notes */}
              {product.notes && (
                <div>
                  <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Notes
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                    {product.notes}
                  </p>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {product.source_url && (
                  <a
                    href={product.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink size={13} /> View Source
                    </Button>
                  </a>
                )}
                {product.weidian_url && (
                  <a
                    href={product.weidian_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink size={13} /> Weidian
                    </Button>
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                <Button onClick={startEdit}>Edit Product</Button>
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-[var(--text-muted)] text-center mt-8">
        Press Ctrl+K to search
      </p>

      {/* Image lightbox */}
      <Lightbox
        images={images}
        initialIndex={activeImage}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </AppShell>
  );
}
