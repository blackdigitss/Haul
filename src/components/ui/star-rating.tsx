"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = 16,
  readonly = false,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={cn(
            "transition-all duration-150",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default"
          )}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors duration-150",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-[var(--text-muted)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}
