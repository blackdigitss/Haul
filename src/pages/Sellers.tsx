import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Store } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VetBadge } from "@/components/shared/badges";
import { TrustRing } from "@/components/sellers/TrustRing";
import { useItems, useRedditRefs, useSellers } from "@/hooks/use-data";
import { categoryStrengths, trustScore } from "@/lib/trust";
import { cn } from "@/lib/utils";

type SortKey = "trust" | "items" | "recent";

export default function Sellers() {
  const { data: sellers = [], isLoading } = useSellers();
  const { data: items = [] } = useItems();
  const { data: refs = [] } = useRedditRefs();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("trust");

  const enriched = useMemo(() => {
    return sellers.map((s) => {
      const sellerItems = items.filter((i) => i.sellerId === s.id);
      const refCount = refs.filter((r) => r.sellerId === s.id).length;
      return {
        seller: s,
        items: sellerItems,
        trust: trustScore(s, sellerItems, refCount),
        bestFor: categoryStrengths(sellerItems),
      };
    });
  }, [sellers, items, refs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = enriched.filter(
      ({ seller }) =>
        !q || seller.name.toLowerCase().includes(q) || seller.subdomain.toLowerCase().includes(q)
    );
    switch (sort) {
      case "trust":
        return list.sort((a, b) => b.trust.score - a.trust.score);
      case "items":
        return list.sort((a, b) => b.items.length - a.items.length);
      case "recent":
        return list.sort((a, b) => b.seller.createdAt - a.seller.createdAt);
    }
  }, [enriched, search, sort]);

  return (
    <div>
      <PageHeader eyebrow={`${sellers.length} tracked`} title="Sellers" />

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sellers…"
            className="w-full rounded-2xl border border-input bg-card py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-1.5">
          {(
            [
              ["trust", "By trust"],
              ["items", "Most items"],
              ["recent", "Newest"],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                sort === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="img-loading h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No sellers yet"
          hint="Sellers are created automatically when you save items from their Yupoo catalogs."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(({ seller, items: sellerItems, trust, bestFor }, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35 }}
            >
              <Link
                to={`/sellers/${seller.id}`}
                className="card-lux flex items-center gap-4 rounded-2xl border border-border p-4 transition-colors hover:border-primary/40"
              >
                <TrustRing trust={trust} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-base font-semibold">{seller.name}</p>
                    <VetBadge status={seller.vetStatus} />
                  </div>
                  <p className="mt-0.5 truncate font-num text-[11px] text-muted-foreground">
                    {sellerItems.length} items{seller.subdomain ? ` · ${seller.subdomain}` : ""}
                  </p>
                  {bestFor.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {bestFor.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-editorial text-secondary-foreground"
                        >
                          Best for {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
