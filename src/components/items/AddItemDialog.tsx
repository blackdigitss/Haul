import { useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, PenLine, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, proxyImg } from "@/lib/utils";
import { convertCNYtoUSD } from "@/lib/currency";
import { useCurrency } from "@/hooks/use-currency";
import { useAddItem, useFindOrCreateSeller, useSettings } from "@/hooks/use-data";
import {
  ingestItemImages,
  parseImport,
  scrapeUrl,
  type ParsedImportItem,
  type RawScrape,
} from "@/lib/services";
import { detectBatch, parsePriceCNY } from "@/lib/parse";
import { TIER_CONFIG, TIER_ORDER, type Tier } from "@/types";

export function AddItemDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add to the archive</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="link">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link" className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Link
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <PenLine className="h-3.5 w-3.5" /> Manual
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Paste
            </TabsTrigger>
          </TabsList>
          <TabsContent value="link">
            <LinkTab onDone={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualTab onDone={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="ai">
            <AiPasteTab onDone={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ————— shared bits —————

function TierPicker({ value, onChange }: { value: Tier; onChange: (t: Tier) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TIER_ORDER.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === t
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label}
        </button>
      ))}
    </div>
  );
}

// ————— link tab —————

function LinkTab({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrape, setScrape] = useState<RawScrape | null>(null);
  const [title, setTitle] = useState("");
  const [priceCNY, setPriceCNY] = useState("");
  const [tier, setTier] = useState<Tier>("want");
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data: settings } = useSettings();
  const { rate } = useCurrency();
  const addItem = useAddItem();
  const findOrCreateSeller = useFindOrCreateSeller();

  const runScrape = async () => {
    if (!url.trim()) return;
    setScraping(true);
    try {
      const result = await scrapeUrl(url.trim(), settings?.brands ?? []);
      setScrape(result);
      setTitle(result.title);
      setPriceCNY(result.priceCNY != null ? String(result.priceCNY) : "");
      setSelectedImages(new Set(result.images.slice(0, 8).map((_, i) => i)));
      if (result.images.length === 0) {
        toast.info("No images found — you can still save the item.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scrape failed");
    } finally {
      setScraping(false);
    }
  };

  const save = async () => {
    if (!scrape) return;
    setSaving(true);
    try {
      let sellerId: string | null = null;
      let sellerName = scrape.sellerName;
      if (scrape.sellerSubdomain) {
        const seller = await findOrCreateSeller.mutateAsync({
          name: scrape.sellerName || scrape.sellerSubdomain,
          subdomain: scrape.sellerSubdomain,
          yupooUrl: `https://${scrape.sellerSubdomain}.x.yupoo.com`,
        });
        sellerId = seller.id;
        sellerName = seller.name;
      }
      const cny = priceCNY ? parseFloat(priceCNY) : null;
      const images = scrape.images.filter((_, i) => selectedImages.has(i));
      const item = await addItem.mutateAsync({
        title: title.trim() || "Untitled",
        priceCNY: cny,
        priceUSD: cny != null ? convertCNYtoUSD(cny, rate) : null,
        images,
        sellerId,
        sellerName,
        yupooUrl: scrape.sourcePlatform === "yupoo" ? url.trim() : "",
        albumId: scrape.albumId,
        itemUrl: scrape.itemUrl || (scrape.sourcePlatform === "weidian" ? url.trim() : ""),
        sourcePlatform: (scrape.sourcePlatform as "yupoo" | "weidian" | "taobao" | "other") || "other",
        tier,
        size,
        notes,
        batch: scrape.batch,
        brand: scrape.brand || "",
        category: scrape.category || "",
      });
      // fire-and-forget permanent rehosting
      void ingestItemImages(item.id, images, scrape.sellerSubdomain);
      toast.success("Saved to the archive");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex gap-2">
        <Input
          placeholder="Paste a Yupoo album or Weidian item link…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runScrape()}
        />
        <Button onClick={runScrape} disabled={scraping || !url.trim()}>
          {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
        </Button>
      </div>

      {scrape && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Price ¥{" "}
                {scrape.confidence?.price !== "high" && scrape.priceCNY != null && (
                  <span className="text-status-warehouse">· verify</span>
                )}
              </Label>
              <Input
                type="number"
                value={priceCNY}
                onChange={(e) => setPriceCNY(e.target.value)}
                className={cn(
                  scrape.confidence?.price !== "high" &&
                    scrape.priceCNY != null &&
                    "border-status-warehouse"
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="M / US 10 / 32…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tier</Label>
            <TierPicker value={tier} onChange={setTier} />
          </div>
          {scrape.images.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                Images ({selectedImages.size} selected)
              </Label>
              <div className="grid max-h-48 grid-cols-4 gap-1.5 overflow-y-auto">
                {scrape.images.slice(0, 24).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setSelectedImages((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      })
                    }
                    className={cn(
                      "aspect-square overflow-hidden rounded-md border-2",
                      selectedImages.has(i) ? "border-primary" : "border-transparent opacity-50"
                    )}
                  >
                    <img
                      src={proxyImg(img)}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save item"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ————— manual tab —————

function ManualTab({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [priceCNY, setPriceCNY] = useState("");
  const [tier, setTier] = useState<Tier>("want");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: settings } = useSettings();
  const { rate } = useCurrency();
  const addItem = useAddItem();

  const onTitleChange = (v: string) => {
    setTitle(v);
    // free autofill from the pasted text
    if (!priceCNY) {
      const p = parsePriceCNY(v);
      if (p.value != null) setPriceCNY(String(p.value));
    }
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error("Give it a title");
      return;
    }
    setSaving(true);
    try {
      const cny = priceCNY ? parseFloat(priceCNY) : null;
      await addItem.mutateAsync({
        title: title.trim(),
        priceCNY: cny,
        priceUSD: cny != null ? convertCNYtoUSD(cny, rate) : null,
        tier,
        category,
        brand,
        size,
        itemUrl: itemUrl.trim(),
        sourcePlatform: itemUrl.includes("weidian") ? "weidian" : itemUrl.includes("taobao") ? "taobao" : "other",
        notes,
        batch: detectBatch(title),
      });
      toast.success("Saved to the archive");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Chrome Hearts hoodie ¥268…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Price ¥</Label>
          <Input type="number" value={priceCNY} onChange={(e) => setPriceCNY(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Size</Label>
          <Input value={size} onChange={(e) => setSize(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {(settings?.categories ?? []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Brand</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Item link (Weidian/Taobao)</Label>
        <Input value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} placeholder="https://weidian.com/item.html?itemID=…" />
      </div>
      <div className="space-y-1.5">
        <Label>Tier</Label>
        <TierPicker value={tier} onChange={setTier} />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <Button className="w-full" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save item"}
      </Button>
    </div>
  );
}

// ————— AI paste tab —————

function AiPasteTab({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ParsedImportItem[] | null>(null);
  const [importing, setImporting] = useState(false);

  const { rate } = useCurrency();
  const addItem = useAddItem();

  const runParse = async () => {
    setParsing(true);
    try {
      const items = await parseImport(text);
      if (items.length === 0) {
        toast.info("Couldn't find any items in that text.");
      }
      setRows(items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Parsing failed");
    } finally {
      setParsing(false);
    }
  };

  const runImport = async () => {
    if (!rows) return;
    setImporting(true);
    let ok = 0;
    for (const row of rows) {
      try {
        const cny = row.priceCNY;
        await addItem.mutateAsync({
          title: row.title,
          priceCNY: cny,
          priceUSD:
            row.priceUSD ?? (cny != null ? convertCNYtoUSD(cny, rate) : null),
          brand: row.brand,
          category: row.category,
          batch: row.batch,
          size: row.size,
          itemUrl: row.url,
          sellerName: row.sellerName,
          notes: row.notes,
          tier: "want",
        });
        ok++;
      } catch (e) {
        console.warn("import row failed", e);
      }
    }
    toast.success(`Imported ${ok} of ${rows.length} items`);
    setImporting(false);
    onDone();
  };

  return (
    <div className="space-y-4 pt-2">
      {!rows ? (
        <>
          <p className="text-sm text-muted-foreground">
            Paste anything — a W2C list, spreadsheet rows, Discord messages. The AI turns it into
            clean items.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"denim tears sweatpants L ¥218 topfashion — cold wash only\nJ1 chicago lost&found GET batch us10 469rmb\n…"}
          />
          <Button className="w-full" onClick={runParse} disabled={parsing || !text.trim()}>
            {parsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Parse with AI
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Found {rows.length} item{rows.length === 1 ? "" : "s"} — review before importing.
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {rows.map((r, i) => (
              <div key={i} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    r.brand,
                    r.category,
                    r.batch,
                    r.size,
                    r.priceCNY != null ? `¥${r.priceCNY}` : null,
                    r.sellerName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {r.notes && <p className="mt-1 text-xs italic text-muted-foreground">{r.notes}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRows(null)}>
              Back
            </Button>
            <Button className="flex-1" onClick={runImport} disabled={importing || rows.length === 0}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${rows.length}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
