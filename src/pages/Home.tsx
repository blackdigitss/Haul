import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Package, Plus, Ship, Shirt, Store } from "lucide-react";
import { greeting, formatUSD, formatCNY } from "@/lib/utils";
import { useHauls, useItems, useSellers } from "@/hooks/use-data";
import { HAUL_STATUS_CONFIG, STATUS_CONFIG } from "@/types";
import { ItemCard } from "@/components/items/ItemCard";
import { AddItemDialog } from "@/components/items/AddItemDialog";
import { SectionLabel } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

import type { Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemAnim: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Home() {
  const { data: items = [] } = useItems();
  const { data: sellers = [] } = useSellers();
  const { data: hauls = [] } = useHauls();
  const [addOpen, setAddOpen] = useState(false);

  const stats = useMemo(() => {
    const activeHauls = hauls.filter((h) => h.status !== "received");
    const wishlistValue = items
      .filter((i) => ["saved", "planned"].includes(i.status))
      .reduce((sum, i) => sum + (i.priceUSD || 0), 0);
    return { items: items.length, sellers: sellers.length, activeHauls: activeHauls.length, wishlistValue };
  }, [items, sellers, hauls]);

  const grails = useMemo(
    () => items.filter((i) => i.tier === "grail" || i.tier === "cop").slice(0, 6),
    [items]
  );
  const recent = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4), [items]);
  const activeHauls = useMemo(
    () => hauls.filter((h) => h.status !== "received").slice(0, 3),
    [hauls]
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <motion.header variants={itemAnim} className="flex items-end justify-between">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-ultra text-primary">
            {greeting()}
          </p>
          <h1 className="font-display text-3xl font-semibold">The Archive</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </motion.header>

      <motion.div variants={itemAnim} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Shirt} label="Items" value={String(stats.items)} to="/items" />
        <StatCard icon={Store} label="Sellers" value={String(stats.sellers)} to="/sellers" />
        <StatCard icon={Ship} label="Active Hauls" value={String(stats.activeHauls)} to="/hauls" />
        <StatCard icon={Package} label="Wishlist" value={formatUSD(stats.wishlistValue)} to="/insights" />
      </motion.div>

      {items.length === 0 && (
        <motion.div variants={itemAnim}>
          <EmptyState
            icon={Shirt}
            title="Start your archive"
            hint="Paste a Yupoo album or Weidian link and Haul pulls the title, price, images, and seller automatically."
            action={
              <button
                onClick={() => setAddOpen(true)}
                className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Add your first item
              </button>
            }
          />
        </motion.div>
      )}

      {grails.length > 0 && (
        <motion.section variants={itemAnim}>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>On the radar</SectionLabel>
            <Link to="/items" className="flex items-center gap-1 text-xs text-primary">
              All items <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {grails.map((item) => (
              <div key={item.id} className="w-40 shrink-0">
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {activeHauls.length > 0 && (
        <motion.section variants={itemAnim}>
          <SectionLabel>Haul pipeline</SectionLabel>
          <div className="space-y-2.5">
            {activeHauls.map((h) => {
              const cfg = HAUL_STATUS_CONFIG[h.status];
              const pct = ((cfg.order + 1) / 4) * 100;
              return (
                <Link
                  key={h.id}
                  to={`/hauls/${h.id}`}
                  className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">{h.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {h.productIds.length} items · {formatCNY(h.totalCNY)}
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {cfg.emoji} {cfg.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </motion.section>
      )}

      {recent.length > 0 && (
        <motion.section variants={itemAnim}>
          <SectionLabel>Recent saves</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </motion.section>
      )}

      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof Shirt;
  label: string;
  value: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <Icon className="mb-2 h-4 w-4 text-primary" strokeWidth={1.8} />
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-editorial text-muted-foreground">{label}</p>
    </Link>
  );
}
