"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/data-context";

export default function NewHaulPage() {
  const router = useRouter();
  const { createHaul } = useData();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingAgent, setShippingAgent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      setSaving(true);
      try {
        const haul = await createHaul({
          name: name.trim(),
          status: "planning",
          total_cny: 0,
          total_usd: 0,
          product_ids: [],
          notes,
          shipping_agent: shippingAgent || undefined,
        });
        router.push(`/hauls/${haul.id}`);
      } finally {
        setSaving(false);
      }
    },
    [name, notes, shippingAgent, createHaul, router]
  );

  return (
    <AppShell>
      <Link
        href="/hauls"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to Hauls
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-6">New Haul</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Haul Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. March Haul, Birthday Haul..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Shipping Agent
          </label>
          <Input
            value={shippingAgent}
            onChange={(e) => setShippingAgent(e.target.value)}
            placeholder="e.g. PandaBuy, Superbuy, CSSBuy..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any notes about this haul..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {saving ? "Creating..." : "Create Haul"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
