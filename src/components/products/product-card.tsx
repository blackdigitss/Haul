"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink,
  MoreVertical,
  ShoppingBag,
  Trash2,
  GripVertical,
  Edit3,
  Package,
} from "lucide-react";
import { cn, formatUSD, truncate, proxyImg } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { TIER_CONFIG, STATUS_CONFIG } from "@/types";
import type { Product, Tier } from "@/types";

interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  onTierChange?: (id: string, tier: Tier) => void;
  onAddToHaul?: (id: string) => void;
  isDraggable?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function ProductCard({
  product,
  onDelete,
  onTierChange,
  onAddToHaul,
  isDraggable,
  dragHandleProps,
}: ProductCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const tier = TIER_CONFIG[product.tier];
  const status = STATUS_CONFIG[product.status];

  const handleMenuAction = useCallback(
    (action: () => void) => {
      action();
      setMenuOpen(false);
    },
    []
  );

  const rawImage =
    product.images[0] || product.original_images?.[0] || "";
  const primaryImage = rawImage ? proxyImg(rawImage) : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative rounded-xl border overflow-hidden",
        "bg-[var(--bg-card)] border-[var(--border)]",
        "hover:border-[var(--text-muted)] transition-all duration-200",
        "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        product.tier === "must-cop" && "border-t-2 border-t-rose-500/40"
      )}
    >
      {/* Drag handle */}
      {isDraggable && (
        <div
          {...dragHandleProps}
          className="absolute top-2 left-2 z-10 p-1 rounded bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} className="text-white" />
        </div>
      )}

      {/* Menu button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className={cn(
            "p-1.5 rounded-lg backdrop-blur-sm transition-all",
            menuOpen
              ? "bg-black/60 opacity-100"
              : "bg-black/40 opacity-0 group-hover:opacity-100"
          )}
        >
          <MoreVertical size={14} className="text-white" />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl py-1">
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Edit3 size={13} /> Edit Product
              </Link>
              {product.source_url && (
                <a
                  href={product.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-secondary)] transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink size={13} /> View Source
                </a>
              )}
              {onAddToHaul && product.status === "saved" && (
                <button
                  onClick={() =>
                    handleMenuAction(() => onAddToHaul(product.id))
                  }
                  className="flex items-center gap-2 px-3 py-2 text-xs w-full hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <ShoppingBag size={13} /> Add to Haul
                </button>
              )}
              {/* Tier submenu */}
              <div className="border-t border-[var(--border)] mt-1 pt-1">
                <div className="px-3 py-1 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Priority
                </div>
                {(Object.keys(TIER_CONFIG) as Tier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      handleMenuAction(() => onTierChange?.(product.id, t))
                    }
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs w-full transition-colors",
                      product.tier === t
                        ? "bg-[var(--bg-secondary)]"
                        : "hover:bg-[var(--bg-secondary)]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        TIER_CONFIG[t].color.replace("text-", "bg-")
                      )}
                    />
                    {TIER_CONFIG[t].label}
                  </button>
                ))}
              </div>
              {onDelete && (
                <div className="border-t border-[var(--border)] mt-1 pt-1">
                  <button
                    onClick={() =>
                      handleMenuAction(() => onDelete(product.id))
                    }
                    className="flex items-center gap-2 px-3 py-2 text-xs w-full text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden">
          {primaryImage && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={primaryImage}
              alt={product.name}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                "group-hover:scale-105",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={32} className="text-[var(--text-muted)]" />
            </div>
          )}
          {!imgLoaded && primaryImage && !imgError && (
            <div className="absolute inset-0 img-loading" />
          )}

          {/* Tier badge overlay */}
          {product.tier !== "maybe" && (
            <div className="absolute bottom-2 left-2">
              <Badge className={cn("border text-[10px] font-semibold", tier.bg, tier.color)}>
                {tier.label}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm leading-snug hover:underline decoration-[var(--text-muted)] underline-offset-2">
            {truncate(product.name, 50)}
          </h3>
        </Link>
        {product.brand && (
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {product.brand}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-base font-bold tracking-tight">
            {formatUSD(product.price_usd)}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[10px]", status.color)}
          >
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/sellers/${product.seller_id}`}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors truncate max-w-[60%]"
          >
            {product.seller_name}
          </Link>
          {product.rating > 0 && (
            <StarRating value={product.rating} size={12} readonly />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Badge className="text-[10px]">{product.category}</Badge>
          {product.style && product.style !== "Other" && (
            <Badge variant="outline" className="text-[10px]">
              {product.style}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
