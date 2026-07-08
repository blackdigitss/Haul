import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Store } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VetBadge } from "@/components/shared/badges";
import { StarRating } from "@/components/shared/StarRating";
import { useItems, useSellers } from "@/hooks/use-data";
import type { Seller } from "@/types";

function avgRating(s: Seller): number {
  const vals = Object.values(s.ratings).filter((v) => v > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function Sellers() {
  const { data: sellers = [], isLoading } = useSellers();
  const { data: items = [] } = useItems();
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) {
      if (i.sellerId) map.set(i.sellerId, (map.get(i.sellerId) || 0) + 1);
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sellers
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.subdomain.toLowerCase().includes(q))
      .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
  }, [sellers, search, counts]);

  return (
    <div>
      <PageHeader eyebrow={`${sellers.length} tracked`} title="Sellers" />

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sellers…"
          className="w-full rounded-full border border-input bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="img-loading h-20 rounded-xl" />
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
          {filtered.map((s) => {
            const rating = avgRating(s);
            return (
              <Link
                key={s.id}
                to={`/sellers/${s.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-muted font-display text-lg font-semibold text-muted-foreground">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{s.name}</p>
                    <VetBadge status={s.vetStatus} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {counts.get(s.id) || 0} items{s.subdomain ? ` · ${s.subdomain}` : ""}
                  </p>
                </div>
                {rating > 0 && <StarRating value={Math.round(rating)} size="sm" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
