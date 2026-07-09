import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn, formatCNY, formatUSD } from "@/lib/utils";
import type { Item } from "@/types";
import { BatchBadge, StatusBadge, TierBadge } from "@/components/shared/badges";
import { ItemImage } from "@/components/shared/ItemImage";

export function ItemCard({
  item,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  item: Item;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const inner = (
    <motion.article
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "card-lux group overflow-hidden rounded-2xl border border-border transition-all hover:border-primary/35 hover:shadow-2xl hover:shadow-ink/40",
        item.tier === "grail" && "grail-card",
        selected && "ring-2 ring-primary"
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <ItemImage item={item} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          <TierBadge tier={item.tier} />
          {item.batch && <BatchBadge batch={item.batch} className="bg-background/85 backdrop-blur" />}
        </div>
        {selectable && (
          <span
            className={cn(
              "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/70 bg-black/30 text-transparent"
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {item.title || "Untitled"}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-num text-sm font-semibold text-foreground">
            {item.priceCNY != null ? formatCNY(item.priceCNY) : "—"}
            {item.priceUSD != null && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {formatUSD(item.priceUSD)}
              </span>
            )}
          </p>
          <StatusBadge status={item.status} />
        </div>
        {item.sellerName && (
          <p className="truncate text-xs text-muted-foreground">{item.sellerName}</p>
        )}
      </div>
    </motion.article>
  );

  if (selectable) {
    return (
      <button type="button" className="w-full text-left" onClick={() => onToggleSelect?.(item.id)}>
        {inner}
      </button>
    );
  }
  return <Link to={`/items/${item.id}`}>{inner}</Link>;
}
