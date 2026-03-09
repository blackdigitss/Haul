"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Store,
  ShoppingBag,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { useData } from "@/contexts/data-context";
import { formatUSD } from "@/lib/utils";
import { TIER_CONFIG } from "@/types";

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
    const totalValue = products.reduce((sum, p) => sum + p.price_usd, 0);
    const activeHauls = hauls.filter(
      (h) => h.status !== "received"
    ).length;
    const mustCops = products.filter((p) => p.tier === "must-cop").length;
    return { totalValue, activeHauls, mustCops };
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <StatCard
          icon={TrendingUp}
          label="Total Value"
          value={formatUSD(stats.totalValue)}
          href="/products"
        />
      </div>

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
