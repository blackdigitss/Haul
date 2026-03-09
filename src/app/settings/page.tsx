"use client";

import { useState, useCallback } from "react";
import { Save, Plus, X, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/data-context";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { settings, updateSettings } = useData();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const [categories, setCategories] = useState<string[]>(
    settings?.categories || []
  );
  const [styles, setStyles] = useState<string[]>(settings?.styles || []);
  const [newCategory, setNewCategory] = useState("");
  const [newStyle, setNewStyle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateSettings({ categories, styles });
    } finally {
      setSaving(false);
    }
  }, [categories, styles, updateSettings]);

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const addStyle = () => {
    if (newStyle.trim() && !styles.includes(newStyle.trim())) {
      setStyles([...styles, newStyle.trim()]);
      setNewStyle("");
    }
  };

  return (
    <AppShell>
      <PageHeader title="Settings" description="Customize your Haul experience" />

      <div className="max-w-2xl space-y-8">
        {/* Account */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {user?.displayName || "Haul User"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </section>

        {/* Theme */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Appearance
          </h2>
          <div className="flex gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 transition-all text-center",
                  theme === t
                    ? "border-[var(--accent)] bg-[var(--bg-card)]"
                    : "border-[var(--border)] hover:border-[var(--text-muted)]"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg mx-auto mb-2",
                    t === "dark" ? "bg-zinc-900" : "bg-zinc-100"
                  )}
                />
                <span className="text-sm font-medium capitalize">{t}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-sm"
              >
                {cat}
                <button
                  onClick={() =>
                    setCategories(categories.filter((c) => c !== cat))
                  }
                  className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add category..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <Button variant="outline" onClick={addCategory}>
              <Plus size={14} />
            </Button>
          </div>
        </section>

        {/* Styles */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Styles
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {styles.map((sty) => (
              <span
                key={sty}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-sm"
              >
                {sty}
                <button
                  onClick={() => setStyles(styles.filter((s) => s !== sty))}
                  className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newStyle}
              onChange={(e) => setNewStyle(e.target.value)}
              placeholder="Add style..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStyle();
                }
              }}
            />
            <Button variant="outline" onClick={addStyle}>
              <Plus size={14} />
            </Button>
          </div>
        </section>

        {/* Save */}
        <div className="pt-4 border-t border-[var(--border)]">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
