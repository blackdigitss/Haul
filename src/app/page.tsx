"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Store,
  ShoppingBag,
  Plus,
  ArrowRight,
  DollarSign,
  Crown,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products/product-card";
import { useData } from "@/contexts/data-context";
import { formatUSD } from "@/lib/utils";
import { TIER_CONFIG, STATUS_CONFIG } from "@/types";
import type { ProductStatus } from "@/types";

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-muted)] transition-all"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
            <Icon size={18} className="text-[var(--text-muted)]" />
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </motion.div>
    </Link>
  );
}

export default function DashboardPage() {
  const { products, sellers, hauls, loading, updateProduct } = useData();

  const stats = useMemo(() => {
    const activeHauls = hauls.filter(
      (h) => h.status !== "received"
    ).length;
    const mustCops = products.filter((p) => p.tier === "must-cop").length;
    return { activeHauls, mustCops };
  }, [products, hauls]);

  const recentProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 4),
    [products]
  );

  const activeHauls = useMemo(
    () => hauls.filter((h) => h.status !== "received").slice(0, 3),
    [hauls]
  );

  // Category breakdown: only count products in purchased hauls (ordered/shipped/received)
  const categoryBreakdown = useMemo(() => {
    const purchasedProductIds = new Set<string>();
    for (const h of hauls) {
      if (h.status === "ordered" || h.status === "shipped" || h.status === "received") {
        for (const pid of h.product_ids) purchasedProductIds.add(pid);
      }
    }
    const map = new Map<string, number>();
    for (const p of products) {
      if (!purchasedProductIds.has(p.id)) continue;
      const cat = p.category || "Other";
      map.set(cat, (map.get(cat) ?? 0) + p.price_usd);
    }
    const sorted = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxVal = sorted.length > 0 ? sorted[0][1] : 1;
    return sorted.map(([category, total]) => ({
      category,
      total,
      pct: (total / maxVal) * 100,
    }));
  }, [products, hauls]);

  // Status pipeline counts
  const statusCounts = useMemo(() => {
    const statuses: ProductStatus[] = [
      "saved",
      "in-haul",
      "ordered",
      "shipped",
      "received",
    ];
    return statuses.map((s) => ({
      status: s,
      count: products.filter((p) => p.status === s).length,
      config: STATUS_CONFIG[s],
    }));
  }, [products]);

  // Quick stats
  const quickStats = useMemo(() => {
    const avgPrice =
      products.length > 0
        ? products.reduce((sum, p) => sum + p.price_usd, 0) / products.length
        : 0;

    // Top seller: the seller with the most products
    const sellerMap = new Map<string, number>();
    for (const p of products) {
      const name = p.seller_name || "Unknown";
      sellerMap.set(name, (sellerMap.get(name) ?? 0) + 1);
    }
    let topSeller = "—";
    let topSellerCount = 0;
    for (const [name, count] of sellerMap) {
      if (count > topSellerCount) {
        topSeller = name;
        topSellerCount = count;
      }
    }

    // Products added this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisMonth = products.filter((p) => p.created_at >= monthStart).length;

    return { avgPrice, topSeller, topSellerCount, thisMonth };
  }, [products]);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Your collection at a glance"
        action={
          <Link href="/products/new">
            <Button>
              <Plus size={16} />
              Add Product
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Package}
          label="Products"
          value={products.length}
          href="/products"
        />
        <StatCard
          icon={Store}
          label="Sellers"
          value={sellers.length}
          href="/sellers"
        />
        <StatCard
          icon={ShoppingBag}
          label="Active Hauls"
          value={stats.activeHauls}
          href="/hauls"
        />
      </div>

      {/* Quick Stats Row */}
      {products.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Avg Product Price
              </span>
            </div>
            <div className="text-lg font-bold">{formatUSD(quickStats.avgPrice)}</div>
          </div>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Top Seller
              </span>
            </div>
            <div className="text-lg font-bold truncate">{quickStats.topSeller}</div>
            {quickStats.topSellerCount > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {quickStats.topSellerCount} product{quickStats.topSellerCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                This Month
              </span>
            </div>
            <div className="text-lg font-bold">{quickStats.thisMonth}</div>
            <span className="text-xs text-[var(--text-muted)]">
              product{quickStats.thisMonth !== 1 ? "s" : ""} added
            </span>
          </div>
        </div>
      )}

      {/* Must-Cop Highlight */}
      {stats.mustCops > 0 && (
        <Link href="/products">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="mb-8 p-5 rounded-xl border border-rose-500/20 bg-rose-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <AlertTriangle size={18} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-rose-400">
                    Must Cops
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {stats.mustCops} product{stats.mustCops !== 1 ? "s" : ""} flagged as must-cop
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
                View all <ArrowRight size={12} />
              </div>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Status Pipeline */}
      {products.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Status Pipeline</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {statusCounts.map(({ status, count, config }, idx) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-sm"
                >
                  <span className={`font-semibold ${config.color}`}>{count}</span>
                  <span className="text-[var(--text-muted)] text-xs">{config.label}</span>
                </div>
                {idx < statusCounts.length - 1 && (
                  <ArrowRight size={12} className="text-[var(--text-muted)] shrink-0" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spending by Category */}
      {categoryBreakdown.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Spending by Category (Purchased)</h2>
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4">
            {categoryBreakdown.map(({ category, total, pct }) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {formatUSD(total)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-[var(--accent)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Saves</h2>
            <Link
              href="/products"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onTierChange={async (id, tier) =>
                  updateProduct(id, { tier })
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Active Hauls */}
      {activeHauls.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Hauls</h2>
            <Link
              href="/hauls"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {activeHauls.map((haul) => {
              const haulProducts = products.filter((p) =>
                haul.product_ids.includes(p.id)
              );
              return (
                <Link key={haul.id} href={`/hauls/${haul.id}`}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-muted)] transition-all"
                  >
                    <div>
                      <h3 className="font-medium text-sm">{haul.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {haulProducts.length} items · {formatUSD(haul.total_usd)}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {haul.status}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {products.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="mb-6 inline-flex p-5 rounded-2xl bg-[var(--bg-secondary)]">
            <Package size={40} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Welcome to Haul</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mb-6">
            Start building your collection. Paste a Yupoo link or manually add
            products to get started.
          </p>
          <Link href="/products/new">
            <Button size="lg">
              <Plus size={16} />
              Add Your First Product
            </Button>
          </Link>
        </motion.div>
      )}
    </AppShell>
  );
}
