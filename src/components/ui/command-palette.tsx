"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Store,
  ShoppingBag,
  Plus,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { cn, formatUSD, proxyImg } from "@/lib/utils";
import { useData } from "@/contexts/data-context";
import { TIER_CONFIG } from "@/types";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { products, sellers, hauls } = useData();

  // Open on Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelectedIdx(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build results
  const results = useMemo(() => {
    const items: { id: string; type: string; label: string; sublabel: string; href: string; icon: typeof Package }[] = [];
    const q = query.toLowerCase().trim();

    // Quick actions (always shown at top)
    if (!q || "add product".includes(q) || "new".includes(q)) {
      items.push({ id: "action-add", type: "Action", label: "Add Product", sublabel: "Paste URL or manual entry", href: "/products/new", icon: Plus });
    }
    if (!q || "dashboard".includes(q) || "home".includes(q)) {
      items.push({ id: "action-dash", type: "Action", label: "Dashboard", sublabel: "Overview of your collection", href: "/", icon: LayoutDashboard });
    }
    if (!q || "settings".includes(q)) {
      items.push({ id: "action-settings", type: "Action", label: "Settings", sublabel: "Categories, brands, theme", href: "/settings", icon: Settings });
    }

    // Search products
    if (q) {
      const matchedProducts = products
        .filter((p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.seller_name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        )
        .slice(0, 5);

      for (const p of matchedProducts) {
        items.push({
          id: `product-${p.id}`,
          type: "Product",
          label: p.name,
          sublabel: `${formatUSD(p.price_usd)} · ${p.seller_name}${p.brand ? ` · ${p.brand}` : ""}`,
          href: `/products/${p.id}`,
          icon: Package,
        });
      }

      // Search sellers
      const matchedSellers = sellers
        .filter((s) => s.name.toLowerCase().includes(q))
        .slice(0, 3);

      for (const s of matchedSellers) {
        items.push({
          id: `seller-${s.id}`,
          type: "Seller",
          label: s.name,
          sublabel: `${s.product_count} products`,
          href: `/sellers/${s.id}`,
          icon: Store,
        });
      }

      // Search hauls
      const matchedHauls = hauls
        .filter((h) => h.name.toLowerCase().includes(q))
        .slice(0, 3);

      for (const h of matchedHauls) {
        items.push({
          id: `haul-${h.id}`,
          type: "Haul",
          label: h.name,
          sublabel: `${h.product_ids.length} items · ${formatUSD(h.total_usd)}`,
          href: `/hauls/${h.id}`,
          icon: ShoppingBag,
        });
      }
    }

    return items;
  }, [query, products, sellers, hauls]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        navigate(results[selectedIdx].href);
      }
    },
    [results, selectedIdx, navigate]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[81] w-full max-w-lg"
          >
            <div className="mx-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                <Search size={18} className="text-[var(--text-muted)]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, sellers, hauls..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-muted)]"
                />
                <kbd className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {results.length === 0 && query && (
                  <p className="text-sm text-[var(--text-muted)] text-center py-8">
                    No results found
                  </p>
                )}
                {results.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === selectedIdx
                          ? "bg-[var(--bg-secondary)]"
                          : "hover:bg-[var(--bg-secondary)]"
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)]">
                        <Icon size={14} className="text-[var(--text-muted)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        <div className="text-xs text-[var(--text-muted)] truncate">
                          {item.sublabel}
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-secondary)]">
                        {item.type}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                <span>Navigate with arrow keys</span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">↵</kbd> to select
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
