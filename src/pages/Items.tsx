import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckSquare, Plus, Search, Shirt, SlidersHorizontal, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ItemCard } from "@/components/items/ItemCard";
import { AddItemDialog } from "@/components/items/AddItemDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useBulkUpdateItems, useDeleteItems, useHauls, useItems, useSetHaulItems } from "@/hooks/use-data";
import { DEFAULT_FILTERS, filterItems, hasActiveFilters, type ItemFilters, type SortKey } from "@/lib/filter-items";
import { STATUS_CONFIG, STATUS_ORDER, TIER_CONFIG, TIER_ORDER, type Tier } from "@/types";
import { cn } from "@/lib/utils";

const FILTERS_KEY = "items-filters";

export default function Items() {
  const { data: items = [], isLoading } = useItems();
  const { data: hauls = [] } = useHauls();
  const [filters, setFilters] = useState<ItemFilters>(() => {
    try {
      const saved = sessionStorage.getItem(FILTERS_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bulkUpdate = useBulkUpdateItems();
  const deleteItems = useDeleteItems();
  const setHaulItems = useSetHaulItems();

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
    } catch {}
  }, [filters]);

  const filtered = useMemo(() => filterItems(items, filters), [items, filters]);
  const brands = useMemo(
    () => [...new Set(items.map((i) => i.brand).filter(Boolean))].sort(),
    [items]
  );
  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(),
    [items]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const bulkTier = async (tier: Tier) => {
    await bulkUpdate.mutateAsync({ ids: [...selected], patch: { tier } });
    toast.success(`Moved ${selected.size} items to ${TIER_CONFIG[tier].label}`);
    exitSelect();
  };

  const bulkAddToHaul = async (haulId: string) => {
    const haul = hauls.find((h) => h.id === haulId);
    if (!haul) return;
    await setHaulItems.mutateAsync({ haul, addIds: [...selected], allItems: items });
    toast.success(`Added ${selected.size} items to ${haul.name}`);
    exitSelect();
  };

  const bulkDelete = async () => {
    await deleteItems.mutateAsync([...selected]);
    toast.success(`Deleted ${selected.size} items`);
    setConfirmDelete(false);
    exitSelect();
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${filtered.length} of ${items.length}`}
        title="Items"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
              className={cn(
                "rounded-full border p-2.5 transition-colors",
                selectMode ? "border-primary text-primary" : "border-border text-muted-foreground"
              )}
              aria-label="Select items"
            >
              <CheckSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        }
      />

      {/* search + filter bar */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search title, brand, seller, batch…"
              className="w-full rounded-full border border-input bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "rounded-full border p-2.5",
              showFilters || hasActiveFilters(filters)
                ? "border-primary text-primary"
                : "border-border text-muted-foreground"
            )}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* tier pills — always visible */}
        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
          <FilterPill
            active={filters.tier === "all"}
            onClick={() => setFilters((f) => ({ ...f, tier: "all" }))}
          >
            All
          </FilterPill>
          {TIER_ORDER.map((t) => (
            <FilterPill
              key={t}
              active={filters.tier === t}
              onClick={() => setFilters((f) => ({ ...f, tier: f.tier === t ? "all" : t }))}
            >
              {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label}
            </FilterPill>
          ))}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-2 gap-2 overflow-hidden sm:grid-cols-4"
          >
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v as ItemFilters["status"] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.category || "any"}
              onValueChange={(v) => setFilters((f) => ({ ...f, category: v === "any" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.brand || "any"}
              onValueChange={(v) => setFilters((f) => ({ ...f, brand: v === "any" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any brand</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.sort}
              onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as SortKey }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="price-asc">Price ↑</SelectItem>
                <SelectItem value="price-desc">Price ↓</SelectItem>
                <SelectItem value="tier">By tier</SelectItem>
                <SelectItem value="status">By status</SelectItem>
                <SelectItem value="title">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="img-loading aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title={items.length === 0 ? "Nothing archived yet" : "No matches"}
          hint={
            items.length === 0
              ? "Paste a Yupoo or Weidian link to save your first piece."
              : "Try loosening the filters."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selectable={selectMode}
              selected={selected.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* bulk action bar */}
      {selectMode && selected.size > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="glass fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-border p-2.5 shadow-xl"
        >
          <span className="pl-2 text-sm font-medium">{selected.size}</span>
          <Select onValueChange={(v) => bulkTier(v as Tier)}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="Set tier" />
            </SelectTrigger>
            <SelectContent>
              {TIER_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hauls.filter((h) => h.status === "planning").length > 0 && (
            <Select onValueChange={bulkAddToHaul}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="To haul" />
              </SelectTrigger>
              <SelectContent>
                {hauls
                  .filter((h) => h.status === "planning")
                  .map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg p-2 text-destructive"
            aria-label="Delete selected"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={exitSelect} className="rounded-lg p-2 text-muted-foreground" aria-label="Cancel">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} items?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}
