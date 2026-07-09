import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Plus, Radar, Settings, Shirt, Ship, Store } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useHauls, useItems, useSellers } from "@/hooks/use-data";
import { formatCNY } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
  onAddItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: () => void;
}) {
  const navigate = useNavigate();
  const { data: items = [] } = useItems();
  const { data: sellers = [] } = useSellers();
  const { data: hauls = [] } = useHauls();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Jump to anything — items, sellers, hauls…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onAddItem();
            }}
          >
            <Plus className="mr-2 h-4 w-4 text-primary" /> Add item
          </CommandItem>
          <CommandItem onSelect={() => go("/radar")}>
            <Radar className="mr-2 h-4 w-4" /> Search Reddit
          </CommandItem>
          <CommandItem onSelect={() => go("/insights")}>
            <BarChart3 className="mr-2 h-4 w-4" /> Insights
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
        {items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Items">
              {items.slice(0, 40).map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.brand} ${item.sellerName}`}
                  onSelect={() => go(`/items/${item.id}`)}
                >
                  <Shirt className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.title}</span>
                  {item.priceCNY != null && (
                    <span className="font-num ml-auto pl-3 text-xs text-muted-foreground">
                      {formatCNY(item.priceCNY)}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {sellers.length > 0 && (
          <CommandGroup heading="Sellers">
            {sellers.slice(0, 15).map((s) => (
              <CommandItem
                key={s.id}
                value={`${s.name} ${s.subdomain}`}
                onSelect={() => go(`/sellers/${s.id}`)}
              >
                <Store className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {s.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {hauls.length > 0 && (
          <CommandGroup heading="Hauls">
            {hauls.slice(0, 10).map((h) => (
              <CommandItem key={h.id} value={h.name} onSelect={() => go(`/hauls/${h.id}`)}>
                <Ship className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {h.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
