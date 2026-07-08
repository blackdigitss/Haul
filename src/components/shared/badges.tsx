import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BATCH_CONFIG,
  BATCH_TIER_CLASS,
  STATUS_CONFIG,
  TIER_CONFIG,
  VET_CONFIG,
  type ItemStatus,
  type Tier,
  type VetStatus,
} from "@/types";

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  const cfg = TIER_CONFIG[tier];
  if (tier === "grail") {
    return (
      <span
        className={cn(
          "grail-shimmer grail-glow inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-editorial text-ink",
          className
        )}
      >
        <Crown className="h-3 w-3" />
        Grail
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-editorial",
        className
      )}
      style={{
        color: `hsl(var(--${cfg.token}))`,
        backgroundColor: `hsl(var(--${cfg.token}) / 0.12)`,
      }}
    >
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-editorial",
        className
      )}
      style={{
        color: `hsl(var(--${cfg.token}))`,
        backgroundColor: `hsl(var(--${cfg.token}) / 0.12)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `hsl(var(--${cfg.token}))` }}
      />
      {cfg.label}
    </span>
  );
}

export function BatchBadge({ batch, className }: { batch: string; className?: string }) {
  const cfg = BATCH_CONFIG[batch];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-border px-1.5 py-0.5 font-mono text-[10px] font-bold",
        cfg ? BATCH_TIER_CLASS[cfg.tier] : "text-muted-foreground",
        className
      )}
    >
      {batch}
    </span>
  );
}

export function VetBadge({ status, className }: { status: VetStatus; className?: string }) {
  const cfg = VET_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-editorial",
        className
      )}
      style={{
        color: `hsl(var(--${cfg.token}))`,
        backgroundColor: `hsl(var(--${cfg.token}) / 0.12)`,
      }}
      title={cfg.hint}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `hsl(var(--${cfg.token}))` }}
      />
      {cfg.label}
    </span>
  );
}
