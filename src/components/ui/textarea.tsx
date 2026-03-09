"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)]",
        "px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
        "transition-colors duration-150 resize-none",
        "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-0",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
