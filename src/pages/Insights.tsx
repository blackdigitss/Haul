import { useMemo } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader, SectionLabel } from "@/components/layout/PageHeader";
import { useHauls, useItems, useRedditRefs, useSellers, useSettings } from "@/hooks/use-data";
import { downloadBlob, fullBackup, itemsToCSV } from "@/lib/export-data";
import { formatCNY, formatUSD } from "@/lib/utils";
import { TIER_CONFIG, TIER_ORDER, DEFAULT_SETTINGS } from "@/types";

const CHART_TOKENS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

export default function Insights() {
  const { data: items = [] } = useItems();
  const { data: sellers = [] } = useSellers();
  const { data: hauls = [] } = useHauls();
  const { data: refs = [] } = useRedditRefs();
  const { data: settings } = useSettings();

  const stats = useMemo(() => {
    const owned = items.filter((i) => i.status === "delivered");
    const spentCNY = owned.reduce((s, i) => s + (i.priceCNY || 0), 0);
    const wishlistUSD = items
      .filter((i) => ["saved", "planned"].includes(i.status))
      .reduce((s, i) => s + (i.priceUSD || 0), 0);
    const avgCNY =
      items.filter((i) => i.priceCNY != null).length > 0
        ? items.reduce((s, i) => s + (i.priceCNY || 0), 0) /
          items.filter((i) => i.priceCNY != null).length
        : 0;
    return { owned: owned.length, spentCNY, wishlistUSD, avgCNY };
  }, [items]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) {
      const key = i.category || "Uncategorized";
      map.set(key, (map.get(key) || 0) + (i.priceCNY || 0));
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [items]);

  const byBrand = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) {
      if (!i.brand) continue;
      map.set(i.brand, (map.get(i.brand) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [items]);

  const tierDist = useMemo(
    () =>
      TIER_ORDER.map((t) => ({
        tier: t,
        count: items.filter((i) => i.tier === t).length,
      })),
    [items]
  );

  const topSellers = useMemo(() => {
    const map = new Map<string, { name: string; count: number; cny: number }>();
    for (const i of items) {
      if (!i.sellerName) continue;
      const cur = map.get(i.sellerName) || { name: i.sellerName, count: 0, cny: 0 };
      cur.count++;
      cur.cny += i.priceCNY || 0;
      map.set(i.sellerName, cur);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [items]);

  const exportCSV = () => {
    downloadBlob(itemsToCSV(items), "haul-items.csv", "text/csv");
    toast.success("CSV exported");
  };

  const exportJSON = () => {
    downloadBlob(
      fullBackup({ items, sellers, hauls, redditRefs: refs, settings: settings ?? DEFAULT_SETTINGS }),
      "haul-backup.json",
      "application/json"
    );
    toast.success("Backup exported");
  };

  const maxTier = Math.max(1, ...tierDist.map((d) => d.count));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="The numbers"
        title="Insights"
        action={
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs hover:border-primary/50"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs hover:border-primary/50"
            >
              <Download className="h-3.5 w-3.5" /> Backup
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Delivered" value={String(stats.owned)} />
        <Stat label="Spent (delivered)" value={formatCNY(stats.spentCNY)} />
        <Stat label="Wishlist value" value={formatUSD(stats.wishlistUSD)} />
        <Stat label="Avg item" value={formatCNY(Math.round(stats.avgCNY))} />
      </div>

      {byCategory.length > 0 && (
        <section className="card-lux rounded-2xl border border-border p-5">
          <SectionLabel>Spend by category (¥)</SectionLabel>
          <div className="flex items-center gap-6">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={`hsl(var(${CHART_TOKENS[i % CHART_TOKENS.length]}))`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {byCategory.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: `hsl(var(${CHART_TOKENS[i % CHART_TOKENS.length]}))` }}
                  />
                  <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                  <span className="font-medium">{formatCNY(d.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="card-lux rounded-2xl border border-border p-5">
        <SectionLabel>Tier distribution</SectionLabel>
        <div className="space-y-2.5">
          {tierDist.map(({ tier, count }) => (
            <div key={tier} className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted-foreground">
                {TIER_CONFIG[tier].emoji} {TIER_CONFIG[tier].label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / maxTier) * 100}%`,
                    backgroundColor: `hsl(var(--tier-${tier}))`,
                  }}
                />
              </div>
              <span className="w-6 text-right text-sm font-medium">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {byBrand.length > 0 && (
        <section className="card-lux rounded-2xl border border-border p-5">
          <SectionLabel>Top brands</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {byBrand.map(([brand, count], i) => (
              <span
                key={brand}
                className="rounded-full border border-border px-3.5 py-1.5 text-sm"
              >
                {i === 0 && "🥇 "}
                {i === 1 && "🥈 "}
                {i === 2 && "🥉 "}
                {brand} <span className="text-muted-foreground">×{count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {topSellers.length > 0 && (
        <section className="card-lux rounded-2xl border border-border p-5">
          <SectionLabel>Top sellers</SectionLabel>
          <ul className="space-y-2">
            {topSellers.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <span className="text-muted-foreground">
                  {s.count} items · {formatCNY(Math.round(s.cny))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-lux rounded-2xl border border-border p-4">
      <p className="font-num text-xl font-semibold">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-editorial text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
