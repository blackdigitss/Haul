import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Moon, Plus, RefreshCw, Sun, X } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, useUpdateSettings } from "@/hooks/use-data";
import { useTheme } from "@/hooks/use-theme";
import { useCurrency } from "@/hooks/use-currency";
import { AGENTS } from "@/lib/agents";
import { isDemo } from "@/lib/demo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { theme, toggle } = useTheme();
  const { rate } = useCurrency();

  if (!settings) return null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Tune it" title="Settings" />

      {isDemo() && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm">
          You're in <strong>demo mode</strong> — changes live only in this tab.{" "}
          <button className="text-primary underline" onClick={signOut}>
            Exit demo
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionLabel>Account</SectionLabel>
        <div className="flex items-center justify-between">
          <p className="text-sm">{user?.email ?? "—"}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionLabel>Appearance</SectionLabel>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Dark mode
          </span>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionLabel>Buying</SectionLabel>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">Preferred agent</p>
              <p className="text-xs text-muted-foreground">Shown first on every item</p>
            </div>
            <Select
              value={settings.preferredAgent}
              onValueChange={(v) => updateSettings.mutate({ preferredAgent: v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Exchange rate</p>
              <p className="text-xs text-muted-foreground">CNY → USD, refreshed every 4h</p>
            </div>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              {rate.toFixed(4)}
            </span>
          </div>
        </div>
      </section>

      <ChipListEditor
        label="Reddit subs"
        hint="Searched by Radar and seller vetting"
        values={settings.redditSubs}
        prefix="r/"
        onChange={(redditSubs) => updateSettings.mutate({ redditSubs })}
      />
      <ChipListEditor
        label="Categories"
        values={settings.categories}
        onChange={(categories) => updateSettings.mutate({ categories })}
      />
      <ChipListEditor
        label="Brands"
        hint="Used by the scraper to auto-detect brands"
        values={settings.brands}
        onChange={(brands) => updateSettings.mutate({ brands })}
      />
    </div>
  );
}

function ChipListEditor({
  label,
  hint,
  values,
  prefix = "",
  onChange,
}: {
  label: string;
  hint?: string;
  values: string[];
  prefix?: string;
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim().replace(/^r\//i, "");
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
    toast.success(`Added ${prefix}${v}`);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionLabel>{label}</SectionLabel>
      {hint && <p className="-mt-2 mb-3 text-xs text-muted-foreground">{hint}</p>}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs"
          >
            {prefix}
            {v}
            <button
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={`Add ${label.toLowerCase().replace(/s$/, "")}…`}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={add}
          className="rounded-lg border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
          aria-label="Add"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
