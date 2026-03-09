"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)]",
            "px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-0",
            icon && "pl-9",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
