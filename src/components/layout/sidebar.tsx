"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Store,
  ShoppingBag,
  Plus,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Search,
  ClipboardPaste,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useState, useCallback, useEffect, useMemo } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/sellers", label: "Sellers", icon: Store },
  { href: "/hauls", label: "Hauls", icon: ShoppingBag },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { products, hauls } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  const activeHaulCount = useMemo(
    () => hauls.filter((h) => h.status !== "received").length,
    [hauls]
  );

  const openCommandPalette = useCallback(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
  }, []);

  const pasteAndNavigate = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (
        /yupoo\.com/i.test(trimmed) ||
        /weidian\.com/i.test(trimmed)
      ) {
        router.push(`/products/new?url=${encodeURIComponent(trimmed)}`);
        setMobileOpen(false);
      }
    } catch {
      // Clipboard access denied or empty — silently ignore
    }
  }, [router]);

  const getBadge = (label: string): number | null => {
    if (label === "Products") return products.length || null;
    if (label === "Hauls") return activeHaulCount || null;
    return null;
  };

  const navContent = (
    <>
      {/* Logo + Command Palette shortcut */}
      <div className="px-4 pt-6 pb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[var(--bg-primary)] font-bold text-sm">H</span>
          </div>
          <span className="text-lg font-bold tracking-tight">Haul</span>
        </Link>
        <button
          onClick={openCommandPalette}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium",
            "border border-[var(--border)] bg-[var(--bg-secondary)]",
            "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            "transition-colors duration-150"
          )}
          title={`Search (${isMac ? "⌘" : "Ctrl+"}K)`}
        >
          <Search size={12} />
          <span>{isMac ? "⌘K" : "Ctrl+K"}</span>
        </button>
      </div>

      {/* Add New + Clipboard paste */}
      <div className="px-3 mb-6 flex items-center gap-2">
        <Link
          href="/products/new"
          className={cn(
            "flex-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
            "bg-[var(--accent)] text-[var(--bg-primary)]",
            "hover:opacity-90 transition-all duration-150 active:scale-[0.98]"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <Plus size={16} />
          Add Product
        </Link>
        <button
          onClick={pasteAndNavigate}
          className={cn(
            "flex items-center justify-center rounded-lg p-2.5",
            "border border-[var(--border)] bg-[var(--bg-secondary)]",
            "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
            "transition-all duration-150 active:scale-[0.96]"
          )}
          title="Paste product URL from clipboard"
        >
          <ClipboardPaste size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const badge = getBadge(item.label);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-all duration-150",
                isActive
                  ? "text-[var(--text-primary)] bg-[var(--bg-secondary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--accent)] rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon size={18} />
              {item.label}
              {badge !== null && (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center justify-center rounded-full px-1.5 py-0.5",
                    "text-[10px] font-semibold leading-none min-w-[18px]",
                    isActive
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-1 border-t border-[var(--border)] pt-4 mt-4">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
            "transition-all duration-150"
          )}
        >
          <Settings size={18} />
          Settings
        </Link>
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium w-full",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
            "transition-all duration-150"
          )}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        {user && (
          <button
            onClick={() => {
              signOut();
              setMobileOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium w-full",
              "text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/5",
              "transition-all duration-150"
            )}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 border-r border-[var(--border)] bg-[var(--bg-card)]">
        {navContent}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[var(--bg-primary)] font-bold text-xs">H</span>
          </div>
          <span className="font-bold">Haul</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)]"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
