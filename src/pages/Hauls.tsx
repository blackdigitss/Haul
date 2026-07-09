import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Ship } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAddHaul, useHauls } from "@/hooks/use-data";
import { HAUL_STATUS_CONFIG } from "@/types";
import { formatCNY, formatUSD, timeAgo, cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Hauls() {
  const { data: hauls = [], isLoading } = useHauls();
  const addHaul = useAddHaul();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");

  const active = hauls.filter((h) => h.status !== "received");
  const done = hauls.filter((h) => h.status === "received");

  const create = async () => {
    if (!name.trim()) return;
    try {
      await addHaul.mutateAsync({ name: name.trim() });
      toast.success("Haul created");
      setName("");
      setCreateOpen(false);
    } catch {
      toast.error("Couldn't create haul");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${active.length} active`}
        title="Hauls"
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New haul
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="img-loading h-24 rounded-xl" />
          ))}
        </div>
      ) : hauls.length === 0 ? (
        <EmptyState
          icon={Ship}
          title="No hauls yet"
          hint="Group items into a haul to run the shipping math and track it from agent to doorstep."
          action={
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            >
              Start a haul
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <HaulList hauls={active} />
          {done.length > 0 && (
            <>
              <p className="text-[11px] font-medium uppercase tracking-editorial text-muted-foreground">
                Received
              </p>
              <HaulList hauls={done} muted />
            </>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">New haul</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spring haul, 11.11 order…"
                onKeyDown={(e) => e.key === "Enter" && create()}
              />
            </div>
            <Button className="w-full" onClick={create} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HaulList({ hauls, muted = false }: { hauls: import("@/types").Haul[]; muted?: boolean }) {
  return (
    <div className="space-y-2.5">
      {hauls.map((h) => {
        const cfg = HAUL_STATUS_CONFIG[h.status];
        return (
          <Link
            key={h.id}
            to={`/hauls/${h.id}`}
            className={cn(
              "block card-lux rounded-2xl border border-border p-4 transition-colors hover:border-primary/40",
              muted && "opacity-70"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{h.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cfg.emoji} {cfg.label} · {h.productIds.length} items · updated {timeAgo(h.updatedAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-num font-semibold">{formatCNY(h.totalCNY)}</p>
                <p className="text-xs text-muted-foreground">≈ {formatUSD(h.totalUSD)}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
