"use client";

import { useMemo } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/data-context";
import {
  TIER_CONFIG,
  STATUS_CONFIG,
  DEFAULT_FILTERS,
  type Tier,
  type ProductStatus,
  type SortOption,
} from "@/types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "created_at", label: "Date Added" },
  { value: "price_usd", label: "Price" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name" },
  { value: "tier", label: "Priority" },
  { value: "sort_order", label: "Custom Order" },
];

export function FilterBar() {
  const { filters, setFilters, resetFilters, sellers, settings, filteredProducts } =
    useData();

  const categories = useMemo(
    () => settings?.categories || [],
    [settings]
  );

  const styles = useMemo(
    () => settings?.styles || [],
    [settings]
  );

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.categories.length > 0 ||
      filters.styles.length > 0 ||
      filters.sellers.length > 0 ||
      filters.tier !== null ||
      filters.status !== null ||
      filters.rating_min > 0 ||
      filters.price_min > 0 ||
      filters.price_max < 10000
    );
  }, [filters]);

  const toggleArrayFilter = (
    key: "categories" | "styles" | "sellers",
    value: string
  ) => {
    const current = filters[key];
    setFilters({
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  return (
    <div className="sticky top-14 lg:top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)]">
      {/* Search + Sort row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <Input
            icon={<Search size={15} />}
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <select
            value={filters.sort_by}
            onChange={(e) =>
              setFilters({ sort_by: e.target.value as SortOption })
            }
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 6px center",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setFilters({
                sort_dir: filters.sort_dir === "asc" ? "desc" : "asc",
              })
            }
            title={filters.sort_dir === "asc" ? "Ascending" : "Descending"}
          >
            <ArrowUpDown
              size={14}
              className={cn(
                "transition-transform",
                filters.sort_dir === "asc" && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Active filter count / clear */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs text-[var(--text-muted)]"
          >
            <X size={13} />
            Clear
          </Button>
        )}
      </div>

      {/* Filter pills row — scrollable */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
        <div className="flex items-center gap-1 text-[var(--text-muted)] mr-1 flex-shrink-0">
          <SlidersHorizontal size={13} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Filters</span>
        </div>

        {/* Tier pills */}
        {(Object.keys(TIER_CONFIG) as Tier[]).map((t) => (
          <button
            key={t}
            onClick={() =>
              setFilters({ tier: filters.tier === t ? null : t })
            }
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
              filters.tier === t
                ? cn(TIER_CONFIG[t].bg, TIER_CONFIG[t].color)
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            )}
          >
            {TIER_CONFIG[t].label}
          </button>
        ))}

        <div className="w-px h-4 bg-[var(--border)] flex-shrink-0 mx-1" />

        {/* Status pills */}
        {(Object.keys(STATUS_CONFIG) as ProductStatus[]).map((s) => (
          <button
            key={s}
            onClick={() =>
              setFilters({ status: filters.status === s ? null : s })
            }
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
              filters.status === s
                ? cn("bg-[var(--bg-secondary)]", STATUS_CONFIG[s].color)
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            )}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}

        <div className="w-px h-4 bg-[var(--border)] flex-shrink-0 mx-1" />

        {/* Category pills */}
        {categories.slice(0, 8).map((cat) => (
          <button
            key={cat}
            onClick={() => toggleArrayFilter("categories", cat)}
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
              filters.categories.includes(cat)
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--text-muted)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="mt-2 text-[11px] text-[var(--text-muted)]">
        {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
        {hasActiveFilters && " (filtered)"}
      </div>
    </div>
  );
}
