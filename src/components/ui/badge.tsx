"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        "transition-colors duration-150",
        variant === "default" &&
          "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
        variant === "outline" &&
          "border border-[var(--border)] text-[var(--text-secondary)]",
        className
      )}
    >
      {children}
    </span>
  );
}
