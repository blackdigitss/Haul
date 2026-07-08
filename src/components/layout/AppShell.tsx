import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { BottomNav } from "./BottomNav";
import { FloatingAIButton } from "@/components/ai/FloatingAIButton";
import { useTheme } from "@/hooks/use-theme";

export default function AppShell() {
  const location = useLocation();
  useTheme(); // applies the persisted theme class

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-5xl px-5 pb-28 pt-10"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <FloatingAIButton />
      <BottomNav />
    </div>
  );
}
