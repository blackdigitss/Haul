"use client";

import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/sellers", label: "Sellers", icon: Store },
  { href: "/hauls", label: "Hauls", icon: ShoppingBag },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-4 pt-6 pb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[var(--bg-primary)] font-bold text-sm">H</span>
          </div>
          <span className="text-lg font-bold tracking-tight">Haul</span>
        </Link>
      </div>

      {/* Add New */}
      <div className="px-3 mb-6">
        <Link
          href="/products/new"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
            "bg-[var(--accent)] text-[var(--bg-primary)]",
            "hover:opacity-90 transition-all duration-150 active:scale-[0.98]"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
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
