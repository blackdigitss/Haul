"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Save, Plus, X, Loader2, Download } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/data-context";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { cn, formatUSD } from "@/lib/utils";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { settings, updateSettings, products, sellers, hauls } = useData();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState<string[]>(
    settings?.categories || []
  );
  const [styles, setStyles] = useState<string[]>(settings?.styles || []);
  const [brands, setBrands] = useState<string[]>(settings?.brands || []);

  // Sync local state when settings load from Firestore
  useEffect(() => {
    if (settings) {
      setCategories(settings.categories);
      setStyles(settings.styles);
      setBrands(settings.brands);
    }
  }, [settings]);
  const [newCategory, setNewCategory] = useState("");
  const [newStyle, setNewStyle] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [saving, setSaving] = useState(false);

  // Data summary
  const dataSummary = useMemo(() => {
    const uniqueSellers = new Set(products.map((p) => p.seller_id));
    const totalValueUsd = products.reduce((sum, p) => sum + p.price_usd, 0);
    return {
      totalProducts: products.length,
      totalSellers: uniqueSellers.size,
      totalHauls: hauls.length,
      totalValueUsd,
    };
  }, [products, hauls]);

  // Export helpers
  const exportProductsCsv = useCallback(() => {
    const headers = [
      "Name",
      "Brand",
      "Price (CNY)",
      "Price (USD)",
      "Category",
      "Style",
      "Seller",
      "Rating",
      "Tier",
      "Status",
      "Tags",
      "Source URL",
      "Notes",
      "Date Added",
    ];
    const rows = products.map((p) => [
      escapeCsvField(p.name),
      escapeCsvField(p.brand || ""),
      String(p.price_cny),
      String(p.price_usd),
      escapeCsvField(p.category),
      escapeCsvField(p.style),
      escapeCsvField(p.seller_name),
      String(p.rating),
      escapeCsvField(p.tier),
      escapeCsvField(p.status),
      escapeCsvField(p.tags.join("; ")),
      escapeCsvField(p.source_url),
      escapeCsvField(p.notes),
      new Date(p.created_at).toISOString().split("T")[0],
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile("products.csv", csv, "text/csv;charset=utf-8;");
  }, [products]);

  const exportProductsJson = useCallback(() => {
    const data = products.map((p) => ({
      name: p.name,
      brand: p.brand || "",
      price_cny: p.price_cny,
      price_usd: p.price_usd,
      category: p.category,
      style: p.style,
      seller: p.seller_name,
      rating: p.rating,
      tier: p.tier,
      status: p.status,
      tags: p.tags,
      source_url: p.source_url,
      notes: p.notes,
      date_added: new Date(p.created_at).toISOString().split("T")[0],
    }));
    const json = JSON.stringify(data, null, 2);
    downloadFile("products.json", json, "application/json;charset=utf-8;");
  }, [products]);

  const exportHaulsCsv = useCallback(() => {
    const headers = [
      "Name",
      "Status",
      "Total (CNY)",
      "Total (USD)",
      "Products",
      "Shipping Agent",
      "Tracking Number",
      "Notes",
      "Date Created",
    ];
    const rows = hauls.map((h) => [
      escapeCsvField(h.name),
      escapeCsvField(h.status),
      String(h.total_cny),
      String(h.total_usd),
      String(h.product_ids.length),
      escapeCsvField(h.shipping_agent || ""),
      escapeCsvField(h.tracking_number || ""),
      escapeCsvField(h.notes),
      new Date(h.created_at).toISOString().split("T")[0],
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile("hauls.csv", csv, "text/csv;charset=utf-8;");
  }, [hauls]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateSettings({ categories, styles, brands });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [categories, styles, brands, updateSettings, toast]);

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const addStyle = () => {
    if (newStyle.trim() && !styles.includes(newStyle.trim())) {
      setStyles([...styles, newStyle.trim()]);
      setNewStyle("");
    }
  };

  const addBrand = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      setBrands([...brands, newBrand.trim()]);
      setNewBrand("");
    }
  };

  return (
    <AppShell>
      <PageHeader title="Settings" description="Customize your Haul experience" />

      <div className="max-w-2xl space-y-8">
        {/* Account */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {user?.displayName || "Haul User"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </section>

        {/* Theme */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Appearance
          </h2>
          <div className="flex gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 transition-all text-center",
                  theme === t
                    ? "border-[var(--accent)] bg-[var(--bg-card)]"
                    : "border-[var(--border)] hover:border-[var(--text-muted)]"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg mx-auto mb-2",
                    t === "dark" ? "bg-zinc-900" : "bg-zinc-100"
                  )}
                />
                <span className="text-sm font-medium capitalize">{t}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-sm"
              >
                {cat}
                <button
                  onClick={() =>
                    setCategories(categories.filter((c) => c !== cat))
                  }
                  className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add category..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <Button variant="outline" onClick={addCategory}>
              <Plus size={14} />
            </Button>
          </div>
        </section>

        {/* Styles */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Styles
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {styles.map((sty) => (
              <span
                key={sty}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-sm"
              >
                {sty}
                <button
                  onClick={() => setStyles(styles.filter((s) => s !== sty))}
                  className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newStyle}
              onChange={(e) => setNewStyle(e.target.value)}
              placeholder="Add style..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStyle();
                }
              }}
            />
            <Button variant="outline" onClick={addStyle}>
              <Plus size={14} />
            </Button>
          </div>
        </section>

        {/* Brands */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Brands
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {brands.map((br) => (
              <span
                key={br}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-sm"
              >
                {br}
                <button
                  onClick={() =>
                    setBrands(brands.filter((b) => b !== br))
                  }
                  className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="Add brand..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBrand();
                }
              }}
            />
            <Button variant="outline" onClick={addBrand}>
              <Plus size={14} />
            </Button>
          </div>
        </section>

        {/* Save */}
        <div className="pt-4 border-t border-[var(--border)]">
          <Button onClick={handleSave} disabled={saving || !settings}>
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Data Summary */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Data Summary
          </h2>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Total Products</p>
                <p className="text-lg font-semibold">{dataSummary.totalProducts}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Total Sellers</p>
                <p className="text-lg font-semibold">{dataSummary.totalSellers}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Total Hauls</p>
                <p className="text-lg font-semibold">{dataSummary.totalHauls}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Collection Value</p>
                <p className="text-lg font-semibold">{formatUSD(dataSummary.totalValueUsd)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Export Data */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Export Data
          </h2>
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={exportProductsCsv}>
              <Download size={14} />
              Export Products (CSV)
            </Button>
            <Button variant="outline" onClick={exportProductsJson}>
              <Download size={14} />
              Export Products (JSON)
            </Button>
            <Button variant="outline" onClick={exportHaulsCsv}>
              <Download size={14} />
              Export Hauls (CSV)
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
