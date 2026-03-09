"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Plus, Package } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useData } from "@/contexts/data-context";
import { formatUSD, timeAgo } from "@/lib/utils";
import { HAUL_STATUS_CONFIG, type HaulStatus } from "@/types";

export default function HaulsPage() {
  const { hauls, products } = useData();
  const [statusFilter, setStatusFilter] = useState<HaulStatus | "all">("all");

  const filteredHauls = useMemo(() => {
    const filtered =
      statusFilter === "all"
        ? hauls
        : hauls.filter((h) => h.status === statusFilter);
    return filtered.sort((a, b) => b.updated_at - a.updated_at);
  }, [hauls, statusFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Hauls"
        description={`${hauls.length} haul${hauls.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/hauls/new">
            <Button>
              <Plus size={16} />
              New Haul
            </Button>
          </Link>
        }
      />

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {(["all", ...Object.keys(HAUL_STATUS_CONFIG)] as (HaulStatus | "all")[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              statusFilter === s
                ? "bg-[var(--bg-secondary)] border-[var(--text-muted)] text-[var(--text-primary)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            }`}
          >
            {s === "all" ? "All" : HAUL_STATUS_CONFIG[s as HaulStatus].label}
          </button>
        ))}
      </div>

      {filteredHauls.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No hauls yet"
          description="Create a haul to start grouping products for your next order"
          action={
            <Link href="/hauls/new">
              <Button>Create First Haul</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredHauls.map((haul) => {
            const haulProducts = products.filter((p) =>
              haul.product_ids.includes(p.id)
            );
            const statusConfig = HAUL_STATUS_CONFIG[haul.status];
            return (
              <Link key={haul.id} href={`/hauls/${haul.id}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-muted)] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                      <ShoppingBag
                        size={20}
                        className="text-[var(--text-muted)]"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{haul.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <Package size={11} /> {haulProducts.length} items
                        </span>
                        <span className="text-xs font-medium">
                          {formatUSD(haul.total_usd)}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {timeAgo(haul.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
