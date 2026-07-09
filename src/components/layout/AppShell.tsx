import { Link, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BarChart3, Search, Settings } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import { FloatingAIButton } from "@/components/ai/FloatingAIButton";
import { AddItemDialog } from "@/components/items/AddItemDialog";
import { useTheme } from "@/hooks/use-theme";

export default function AppShell() {
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  useTheme(); // applies the persisted theme class

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* top bar */}
      <div className="glass sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-2.5">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight">
            HAUL<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              aria-label="Search everything"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="font-num hidden rounded bg-muted px-1.5 py-0.5 text-[9px] sm:inline">
                ⌘K
              </kbd>
            </button>
            <Link
              to="/insights"
              aria-label="Insights"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <BarChart3 className="h-4 w-4" />
            </Link>
            <Link
              to="/settings"
              aria-label="Settings"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-5xl px-5 pb-32 pt-8"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <FloatingAIButton />
      <BottomNav />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onAddItem={() => setAddOpen(true)}
      />
      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
