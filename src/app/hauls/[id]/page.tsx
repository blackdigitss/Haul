"use client";

import { useState, useMemo, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trash2,
  Save,
  Edit3,
  X,
  Package,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products/product-card";
import { Modal } from "@/components/ui/modal";
import { PageLoader } from "@/components/ui/loading";
import { useData } from "@/contexts/data-context";
import { formatUSD, formatCNY } from "@/lib/utils";
import { HAUL_STATUS_CONFIG, type HaulStatus } from "@/types";

export default function HaulDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hauls, products, updateHaul, deleteHaul, updateProduct } = useData();

  const haul = useMemo(() => hauls.find((h) => h.id === id), [hauls, id]);
  const haulProducts = useMemo(
    () => (haul ? products.filter((p) => haul.product_ids.includes(p.id)) : []),
    [haul, products]
  );
  const availableProducts = useMemo(
    () =>
      haul
        ? products.filter(
            (p) => !haul.product_ids.includes(p.id) && p.status === "saved"
          )
        : [],
    [haul, products]
  );

  const [editing, setEditing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<HaulStatus>("planning");
  const [shippingAgent, setShippingAgent] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback(() => {
    if (!haul) return;
    setName(haul.name);
    setNotes(haul.notes);
    setStatus(haul.status);
    setShippingAgent(haul.shipping_agent || "");
    setTrackingNumber(haul.tracking_number || "");
    setEditing(true);
  }, [haul]);

  const handleSave = useCallback(async () => {
    if (!haul) return;
    setSaving(true);
    try {
      await updateHaul(haul.id, {
        name,
        notes,
        status,
        shipping_agent: shippingAgent || undefined,
        tracking_number: trackingNumber || undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [haul, name, notes, status, shippingAgent, trackingNumber, updateHaul]);

  const handleDelete = useCallback(async () => {
    if (!haul || !window.confirm("Delete this haul? Products won't be deleted."))
      return;
    // Reset product statuses
    for (const p of haulProducts) {
      await updateProduct(p.id, { status: "saved", haul_id: undefined });
    }
    await deleteHaul(haul.id);
    router.push("/hauls");
  }, [haul, haulProducts, deleteHaul, updateProduct, router]);

  const addProductToHaul = useCallback(
    async (productId: string) => {
      if (!haul) return;
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const newIds = [...haul.product_ids, productId];
      const newTotalCny = haul.total_cny + product.price_cny;
      const newTotalUsd = haul.total_usd + product.price_usd;

      await updateHaul(haul.id, {
        product_ids: newIds,
        total_cny: newTotalCny,
        total_usd: newTotalUsd,
      });
      await updateProduct(productId, { status: "in-haul", haul_id: haul.id });
    },
    [haul, products, updateHaul, updateProduct]
  );

  const removeProductFromHaul = useCallback(
    async (productId: string) => {
      if (!haul) return;
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const newIds = haul.product_ids.filter((pid) => pid !== productId);
      const newTotalCny = Math.max(0, haul.total_cny - product.price_cny);
      const newTotalUsd = Math.max(0, haul.total_usd - product.price_usd);

      await updateHaul(haul.id, {
        product_ids: newIds,
        total_cny: newTotalCny,
        total_usd: newTotalUsd,
      });
      await updateProduct(productId, { status: "saved", haul_id: undefined });
    },
    [haul, products, updateHaul, updateProduct]
  );

  if (!haul) return <AppShell><PageLoader /></AppShell>;

  const statusConfig = HAUL_STATUS_CONFIG[haul.status];

  return (
    <AppShell>
      <Link
        href="/hauls"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to Hauls
      </Link>

      <div className="max-w-4xl">
        {editing ? (
          <div className="space-y-4 max-w-lg">
            <h1 className="text-2xl font-bold mb-4">Edit Haul</h1>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Name
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as HaulStatus)}
                options={Object.entries(HAUL_STATUS_CONFIG).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Shipping Agent
              </label>
              <Input
                value={shippingAgent}
                onChange={(e) => setShippingAgent(e.target.value)}
                placeholder="e.g. PandaBuy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Tracking Number
              </label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
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
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {haul.name}
                  </h1>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
                {haul.shipping_agent && (
                  <p className="text-sm text-[var(--text-muted)]">
                    via {haul.shipping_agent}
                    {haul.tracking_number && ` · ${haul.tracking_number}`}
                  </p>
                )}
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

            {/* Totals */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">Items</div>
                <div className="text-xl font-bold">{haulProducts.length}</div>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">Total (USD)</div>
                <div className="text-xl font-bold">{formatUSD(haul.total_usd)}</div>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">Total (CNY)</div>
                <div className="text-xl font-bold">{formatCNY(haul.total_cny)}</div>
              </div>
            </div>

            {haul.notes && (
              <div className="mb-6">
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                  {haul.notes}
                </p>
              </div>
            )}

            {/* Products in haul */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Products</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus size={14} /> Add Products
              </Button>
            </div>

            {haulProducts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl">
                <Package
                  size={32}
                  className="text-[var(--text-muted)] mx-auto mb-3"
                />
                <p className="text-sm text-[var(--text-muted)] mb-3">
                  No products in this haul yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(true)}
                >
                  <Plus size={14} /> Add Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {haulProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDelete={(id) => removeProductFromHaul(id)}
                    onTierChange={async (id, tier) =>
                      updateProduct(id, { tier })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add products modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Products to Haul"
        className="max-w-lg"
      >
        {availableProducts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            No saved products available to add
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ x: 2 }}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-[var(--text-muted)] transition-all"
              >
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatUSD(product.price_usd)} · {product.seller_name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addProductToHaul(product.id)}
                >
                  <Plus size={12} /> Add
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
