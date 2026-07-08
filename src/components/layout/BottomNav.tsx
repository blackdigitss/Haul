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
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border safe-bottom">
      <div className="mx-auto flex max-w-5xl items-stretch justify-around">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute -top-px h-0.5 w-10 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium tracking-editorial uppercase",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
