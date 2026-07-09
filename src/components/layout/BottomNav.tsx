import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Radar, Shirt, Ship, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/items", label: "Items", icon: Shirt },
  { to: "/sellers", label: "Sellers", icon: Store },
  { to: "/hauls", label: "Hauls", icon: Ship },
  { to: "/radar", label: "Radar", icon: Radar },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-4 safe-bottom">
      <nav className="glass pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/70 p-1.5 shadow-2xl shadow-ink/60">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="dock-pill"
                  className="btn-hero absolute inset-0 rounded-xl"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <Icon className="relative h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.9} />
              <span className="relative text-[9px] font-semibold uppercase tracking-editorial">
                {label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
