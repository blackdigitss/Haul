import { cn } from "@/lib/utils";
import { TRUST_BAND_CONFIG, type TrustScore } from "@/lib/trust";

/** circular 0–100 trust gauge */
export function TrustRing({
  trust,
  size = 48,
  className,
}: {
  trust: TrustScore;
  size?: number;
  className?: string;
}) {
  const stroke = size >= 60 ? 5 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cfg = TRUST_BAND_CONFIG[trust.band];
  const color = `hsl(var(--${cfg.token}))`;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      title={`Trust ${trust.score}/100 — ${cfg.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - trust.score / 100)}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span
        className="font-num absolute inset-0 flex items-center justify-center font-semibold"
        style={{ fontSize: size / 3.2, color }}
      >
        {trust.score}
      </span>
    </div>
  );
}
