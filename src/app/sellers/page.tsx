"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, ExternalLink, Star, Package, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useData } from "@/contexts/data-context";
import { averageRating } from "@/lib/utils";

export default function SellersPage() {
  const { sellers, products } = useData();
  const [search, setSearch] = useState("");

  const sellersWithCounts = useMemo(() => {
    return sellers
      .map((seller) => {
        const sellerProducts = products.filter(
          (p) => p.seller_id === seller.id
        );
        return {
          ...seller,
          productCount: sellerProducts.length,
          avgRating: averageRating(seller.ratings),
        };
      })
      .filter(
        (s) =>
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.productCount - a.productCount);
  }, [sellers, products, search]);

  return (
    <AppShell>
      <PageHeader
        title="Sellers"
        description={`${sellers.length} seller${sellers.length !== 1 ? "s" : ""} tracked`}
      />

      <div className="max-w-2xl mb-6">
        <Input
          icon={<Search size={15} />}
          placeholder="Search sellers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {sellersWithCounts.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No sellers yet"
          description="Sellers are automatically created when you save products with Yupoo URLs"
        />
      ) : (
        <div className="space-y-3">
          {sellersWithCounts.map((seller) => (
            <Link key={seller.id} href={`/sellers/${seller.id}`}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-muted)] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0">
                    <Store size={18} className="text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{seller.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Package size={11} /> {seller.productCount} products
                      </span>
                      {seller.avgRating > 0 && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <Star size={11} className="fill-amber-400" />
                          {seller.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={seller.albums_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
