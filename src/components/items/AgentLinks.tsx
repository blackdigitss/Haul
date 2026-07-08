import { ExternalLink, ShoppingCart } from "lucide-react";
import { buildAgentLinks } from "@/lib/agents";
import { useSettings } from "@/hooks/use-data";
import { SectionLabel } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

/** One-tap purchase links on every shopping agent for an item's raw URL. */
export function AgentLinks({ itemUrl }: { itemUrl: string }) {
  const { data: settings } = useSettings();
  const links = buildAgentLinks(itemUrl);
  if (links.length === 0) return null;

  const preferred = settings?.preferredAgent ?? "allchinabuy";
  const sorted = [...links].sort((a, b) =>
    a.id === preferred ? -1 : b.id === preferred ? 1 : 0
  );

  return (
    <section>
      <SectionLabel>Buy via agent</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {sorted.map((link, i) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              i === 0
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:border-primary/50"
            )}
          >
            {i === 0 ? <ShoppingCart className="h-3.5 w-3.5" /> : <ExternalLink className="h-3 w-3" />}
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
