"use client";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)]",
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="aspect-square img-loading" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded img-loading" />
        <div className="h-3 w-1/2 rounded img-loading" />
        <div className="h-3 w-1/3 rounded img-loading" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
