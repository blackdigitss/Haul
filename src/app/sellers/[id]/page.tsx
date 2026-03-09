"use client";

import { useState, useMemo, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Save,
  MessageCircle,
  Edit3,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { ProductCard } from "@/components/products/product-card";
import { PageLoader } from "@/components/ui/loading";
import { useData } from "@/contexts/data-context";
import { averageRating } from "@/lib/utils";
import type { SellerRatings, Seller } from "@/types";

const RATING_CATEGORIES: { key: keyof SellerRatings; label: string }[] = [
  { key: "quality", label: "Quality" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "shipping_speed", label: "Shipping Speed" },
  { key: "value", label: "Value for Money" },
];

export default function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { sellers, products, updateSeller, deleteSeller, updateProduct } = useData();

  const seller = useMemo(
    () => sellers.find((s) => s.id === id),
    [sellers, id]
  );

  const sellerProducts = useMemo(
    () => products.filter((p) => p.seller_id === id),
    [products, id]
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Seller>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback(() => {
    if (!seller) return;
    setForm({
      name: seller.name,
      yupoo_url: seller.yupoo_url,
      albums_url: seller.albums_url,
      weidian_url: seller.weidian_url,
      contact: { ...seller.contact },
      ratings: { ...seller.ratings },
      notes: seller.notes,
    });
    setEditing(true);
  }, [seller]);

  const handleSave = useCallback(async () => {
    if (!seller) return;
    setSaving(true);
    try {
      await updateSeller(seller.id, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [seller, form, updateSeller]);

  const handleDelete = useCallback(async () => {
    if (!seller || !window.confirm("Delete this seller? Products won't be deleted."))
      return;
    await deleteSeller(seller.id);
    router.push("/sellers");
  }, [seller, deleteSeller, router]);

  if (!seller) return <AppShell><PageLoader /></AppShell>;

  const avgRating = averageRating(seller.ratings);

  return (
    <AppShell>
      <Link
        href="/sellers"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to Sellers
      </Link>

      <div className="max-w-3xl">
        {editing ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold mb-4">Edit Seller</h1>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Name
              </label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Yupoo URL
                </label>
                <Input
                  value={form.yupoo_url || ""}
                  onChange={(e) => setForm({ ...form, yupoo_url: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Weidian URL
                </label>
                <Input
                  value={form.weidian_url || ""}
                  onChange={(e) => setForm({ ...form, weidian_url: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  WhatsApp
                </label>
                <Input
                  value={form.contact?.whatsapp || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, whatsapp: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  WeChat
                </label>
                <Input
                  value={form.contact?.wechat || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, wechat: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            {/* Rating categories */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wider">
                Ratings
              </label>
              <div className="space-y-3">
                {RATING_CATEGORIES.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {label}
                    </span>
                    <StarRating
                      value={form.ratings?.[key] || 0}
                      onChange={(v) =>
                        setForm({
                          ...form,
                          ratings: { ...form.ratings!, [key]: v },
                        })
                      }
                      size={18}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Notes
              </label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">
                  {seller.name}
                </h1>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating value={Math.round(avgRating)} readonly size={16} />
                    <span className="text-sm text-[var(--text-muted)]">
                      {avgRating.toFixed(1)} avg
                    </span>
                  </div>
                )}
                <p className="text-sm text-[var(--text-muted)]">
                  {sellerProducts.length} product{sellerProducts.length !== 1 ? "s" : ""} saved
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Edit3 size={13} /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>

            {/* Links & Contact */}
            <div className="flex flex-wrap gap-2 mb-6">
              <a
                href={seller.albums_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink size={13} /> Albums
                </Button>
              </a>
              {seller.weidian_url && (
                <a
                  href={seller.weidian_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink size={13} /> Weidian
                  </Button>
                </a>
              )}
              {seller.contact.whatsapp && (
                <a
                  href={`https://wa.me/${seller.contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <MessageCircle size={13} /> WhatsApp
                  </Button>
                </a>
              )}
            </div>

            {/* Ratings breakdown */}
            {avgRating > 0 && (
              <div className="rounded-xl border border-[var(--border)] p-4 mb-6">
                <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Rating Breakdown
                </h3>
                <div className="space-y-2.5">
                  {RATING_CATEGORIES.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {label}
                      </span>
                      <StarRating
                        value={seller.ratings[key]}
                        readonly
                        size={14}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {seller.notes && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Notes
                </h3>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                  {seller.notes}
                </p>
              </div>
            )}

            {/* Products */}
            {sellerProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Products from {seller.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sellerProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onTierChange={async (id, tier) =>
                        updateProduct(id, { tier })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
