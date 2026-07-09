import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Package, Plus, Trash2, Truck, X } from "lucide-react";
import {
  useDeleteHaul,
  useHaul,
  useItems,
  useSetHaulItems,
  useUpdateHaul,
  useUpdateItem,
} from "@/hooks/use-data";
import { compareLines, estimateItemWeight, haulCostBreakdown } from "@/lib/shipping";
import { HAUL_STATUS_CONFIG, SHIPPING_METHODS, type HaulStatus } from "@/types";
import { cn, formatCNY, formatUSD, itemThumb } from "@/lib/utils";
import { SectionLabel } from "@/components/layout/PageHeader";
import { ItemImage } from "@/components/shared/ItemImage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const STATUSES: HaulStatus[] = ["planning", "ordered", "shipped", "received"];

export default function HaulDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: haul, isLoading } = useHaul(id);
  const { data: items = [] } = useItems();
  const updateHaul = useUpdateHaul();
  const deleteHaul = useDeleteHaul();
  const setHaulItems = useSetHaulItems();
  const updateItem = useUpdateItem();

  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLines, setShowLines] = useState(false);

  const members = useMemo(
    () => items.filter((i) => haul?.productIds.includes(i.id)),
    [items, haul]
  );
  const available = useMemo(
    () => items.filter((i) => !i.haulId && i.status === "saved"),
    [items]
  );

  const breakdown = useMemo(
    () =>
      haul
        ? haulCostBreakdown(members, haul.shippingMethod, haul.agentFeeCNY, haul.shippingCostCNY)
        : null,
    [members, haul]
  );
  const lineQuotes = useMemo(
    () => (breakdown ? compareLines(breakdown.weightG) : []),
    [breakdown]
  );

  if (isLoading) return <div className="img-loading h-96 rounded-2xl" />;
  if (!haul || !breakdown) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Haul not found.</p>
        <Link to="/hauls" className="text-sm text-primary">
          Back to hauls
        </Link>
      </div>
    );
  }

  const copySummary = () => {
    const lines = [
      `HAUL: ${haul.name}`,
      ...members.map(
        (m) => `- ${m.title}${m.size ? ` [${m.size}]` : ""} — ${m.priceCNY != null ? `¥${m.priceCNY}` : "?"}`
      ),
      ``,
      `Items: ${formatCNY(breakdown.itemsCNY)}`,
      `Est. weight: ${(breakdown.weightG / 1000).toFixed(1)}kg`,
      `Shipping (${SHIPPING_METHODS[haul.shippingMethod]?.label ?? haul.shippingMethod}): ${formatCNY(breakdown.shippingCNY)}`,
      `Agent fee: ${formatCNY(breakdown.agentFeeCNY)}`,
      `TOTAL: ${formatCNY(breakdown.grandTotalCNY)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Summary copied");
  };

  return (
    <div className="space-y-7">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{haul.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{members.length} items</p>
        </div>
        <button onClick={copySummary} className="rounded-full border border-border p-2.5 text-muted-foreground hover:border-primary/50" aria-label="Copy summary">
          <Copy className="h-4 w-4" />
        </button>
      </header>

      {/* status timeline */}
      <div className="flex items-center gap-1">
        {STATUSES.map((s, i) => {
          const cfg = HAUL_STATUS_CONFIG[s];
          const reached = HAUL_STATUS_CONFIG[haul.status].order >= cfg.order;
          return (
            <button
              key={s}
              onClick={() => updateHaul.mutate({ id: haul.id, status: s })}
              className="group flex flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div className={cn("h-0.5 flex-1", reached ? "bg-primary" : "bg-muted")} />
                )}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs transition-colors",
                    reached
                      ? "border-primary bg-primary/10"
                      : "border-muted text-muted-foreground"
                  )}
                >
                  {reached ? <Check className="h-3.5 w-3.5 text-primary" /> : cfg.emoji}
                </div>
                {i < STATUSES.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      HAUL_STATUS_CONFIG[haul.status].order > cfg.order ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-editorial",
                  reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* cost calculator */}
      <section className="card-lux rounded-2xl border border-border p-5">
        <SectionLabel>Cost breakdown</SectionLabel>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Shipping line</p>
            <Select
              value={haul.shippingMethod || "ems"}
              onValueChange={(v) => updateHaul.mutate({ id: haul.id, shippingMethod: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SHIPPING_METHODS).map(([key, m]) => (
                  <SelectItem key={key} value={key}>
                    {m.label} · {m.minDays}–{m.maxDays}d
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Agent fee ¥</p>
            <Input
              type="number"
              defaultValue={haul.agentFeeCNY || ""}
              onBlur={(e) =>
                updateHaul.mutate({ id: haul.id, agentFeeCNY: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label={`Items (${members.length})`} value={formatCNY(breakdown.itemsCNY)} />
          <Row
            label={`Est. shipping · ${(breakdown.weightG / 1000).toFixed(1)}kg`}
            value={formatCNY(breakdown.shippingCNY)}
          />
          <Row label="Agent fee" value={formatCNY(breakdown.agentFeeCNY)} />
          <div className="border-t border-border pt-2">
            <Row
              label="Grand total"
              value={formatCNY(breakdown.grandTotalCNY)}
              bold
            />
            <p className="font-num mt-1 text-right text-xs text-muted-foreground">
              {formatCNY(breakdown.perItemCNY)}/item · {formatCNY(breakdown.perKgCNY)}/kg
              {breakdown.etaDays && ` · ETA ${breakdown.etaDays[0]}–${breakdown.etaDays[1]} days`}
            </p>
          </div>
        </dl>

        {/* every line, priced for this exact weight */}
        <button
          onClick={() => setShowLines((s) => !s)}
          className="mt-4 w-full rounded-xl border border-border py-2.5 text-xs font-semibold uppercase tracking-editorial text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {showLines ? "Hide" : "Compare"} all shipping lines
        </button>
        {showLines && (
          <div className="mt-3 space-y-1.5 animate-fade-in">
            {lineQuotes.map((q) => (
              <button
                key={q.key}
                onClick={() => updateHaul.mutate({ id: haul.id, shippingMethod: q.key })}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  haul.shippingMethod === q.key
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {q.label}
                    {q.cheapest && (
                      <span className="rounded-full bg-status-delivered/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-editorial text-status-delivered">
                        Cheapest
                      </span>
                    )}
                    {q.fastest && (
                      <span className="rounded-full bg-status-shipped/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-editorial text-status-shipped">
                        Fastest
                      </span>
                    )}
                  </span>
                  <span className="font-num text-[11px] text-muted-foreground">
                    {q.minDays}–{q.maxDays} days{q.note ? ` · ${q.note}` : ""}
                  </span>
                </span>
                <span className="font-num shrink-0 text-sm font-semibold">
                  {formatCNY(q.costCNY)}
                </span>
              </button>
            ))}
            <p className="pt-1 text-[10px] text-muted-foreground">
              Estimates from typical agent rate cards (first-500g base + per-100g) — your agent's
              quote at checkout is final.
            </p>
          </div>
        )}
        {haul.status === "shipped" && (
          <div className="mt-4 space-y-1.5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Tracking number</p>
            <div className="flex gap-2">
              <Input
                defaultValue={haul.trackingNumber}
                placeholder="LX…CN"
                onBlur={(e) => updateHaul.mutate({ id: haul.id, trackingNumber: e.target.value })}
              />
              {haul.trackingNumber && (
                <a
                  href={`https://parcelsapp.com/en/tracking/${haul.trackingNumber}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 text-xs hover:border-primary/50"
                >
                  <Truck className="h-3.5 w-3.5" /> Track
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* items */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>In this haul</SectionLabel>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium hover:border-primary/50"
          >
            <Plus className="h-3.5 w-3.5" /> Add items
          </button>
        </div>
        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Package className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No items yet — add saved pieces.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
              >
                <Link to={`/items/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <ItemImage item={item} className="h-14 w-14 shrink-0 rounded-lg" src={itemThumb(item)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="font-num text-xs text-muted-foreground">
                      {item.priceCNY != null ? formatCNY(item.priceCNY) : "—"}
                      {item.size && ` · ${item.size}`}
                    </p>
                  </div>
                </Link>
                <label className="flex shrink-0 items-center gap-1 font-num text-[11px] text-muted-foreground">
                  <input
                    type="number"
                    defaultValue={estimateItemWeight(item)}
                    onBlur={(e) => {
                      const w = parseInt(e.target.value, 10);
                      if (w > 0 && w !== item.weight) {
                        updateItem.mutate({ id: item.id, weight: w });
                        toast.success("Weight updated");
                      }
                    }}
                    className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-right text-xs outline-none focus:border-primary"
                    aria-label="Item weight in grams"
                  />
                  g
                </label>
                <button
                  onClick={() =>
                    setHaulItems.mutate({ haul, removeIds: [item.id], allItems: items })
                  }
                  className="rounded p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Remove from haul"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        onClick={() => setConfirmDelete(true)}
        className="flex items-center gap-1.5 text-xs text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete haul
      </button>

      {/* add items dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add saved items</DialogTitle>
          </DialogHeader>
          {available.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing with status "Saved" to add.
            </p>
          ) : (
            <div className="space-y-2">
              {available.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-2.5 text-left hover:border-primary/50"
                  onClick={async () => {
                    await setHaulItems.mutateAsync({ haul, addIds: [item.id], allItems: items });
                    toast.success(`Added to ${haul.name}`);
                  }}
                >
                  <ItemImage item={item} className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.priceCNY != null ? formatCNY(item.priceCNY) : "—"}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-primary" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{haul.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Items go back to "Saved" — nothing is lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                await deleteHaul.mutateAsync(haul);
                navigate("/hauls");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn("text-muted-foreground", bold && "font-medium text-foreground")}>{label}</dt>
      <dd className={cn(bold && "font-display text-lg font-semibold")}>{value}</dd>
    </div>
  );
}
