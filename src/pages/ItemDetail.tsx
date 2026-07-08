import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import { useDeleteItems, useItem, useRedditRefs, useAddRedditRef, useDeleteRedditRef, useUpdateItem, useSettings } from "@/hooks/use-data";
import { itemFull, formatCNY, formatUSD, proxyImg, cn, timeAgo } from "@/lib/utils";
import { STATUS_CONFIG, STATUS_ORDER, TIER_CONFIG, TIER_ORDER, type ItemStatus, type Tier } from "@/types";
import { BatchBadge, StatusBadge, TierBadge } from "@/components/shared/badges";
import { StarRating } from "@/components/shared/StarRating";
import { ItemImage } from "@/components/shared/ItemImage";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { AgentLinks } from "@/components/items/AgentLinks";
import { RedditPostCard } from "@/components/reddit/RedditPostCard";
import { SectionLabel } from "@/components/layout/PageHeader";
import { searchReddit, type RedditPost } from "@/lib/services";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(id);
  const updateItem = useUpdateItem();
  const deleteItems = useDeleteItems();
  const { data: refs = [] } = useRedditRefs({ productId: id });
  const addRef = useAddRedditRef();
  const deleteRef = useDeleteRedditRef();
  const { data: settings } = useSettings();

  const [imageIndex, setImageIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [redditResults, setRedditResults] = useState<RedditPost[] | null>(null);
  const [searching, setSearching] = useState(false);

  const gallery = useMemo(() => {
    if (!item) return [];
    const urls = item.imageUrls.length > 0 ? item.imageUrls : item.images.map(proxyImg);
    return urls;
  }, [item]);

  if (isLoading) return <div className="img-loading h-96 rounded-2xl" />;
  if (!item) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Item not found.</p>
        <Link to="/items" className="text-sm text-primary">
          Back to items
        </Link>
      </div>
    );
  }

  const patch = (p: Partial<import("@/types").Item>) =>
    updateItem.mutateAsync({ id: item.id, ...p }).catch(() => toast.error("Update failed"));

  const findOnReddit = async () => {
    setSearching(true);
    try {
      const q = [item.brand, item.title.split(" ").slice(0, 5).join(" ")]
        .filter(Boolean)
        .join(" ")
        .slice(0, 100);
      const posts = await searchReddit({ q, subs: settings?.redditSubs ?? [], limit: 10 });
      setRedditResults(posts);
      if (posts.length === 0) toast.info("No Reddit threads found for this item.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reddit search failed");
    } finally {
      setSearching(false);
    }
  };

  const attachPost = async (post: RedditPost) => {
    await addRef.mutateAsync({
      productId: item.id,
      redditId: post.redditId,
      permalink: post.permalink,
      title: post.title,
      subreddit: post.subreddit,
      author: post.author,
      score: post.score,
      numComments: post.numComments,
      snippet: post.snippet,
      postedAt: post.postedAt || null,
    });
    toast.success("Thread attached");
  };

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* gallery */}
        <div className="space-y-2">
          <button
            className={cn(
              "block w-full overflow-hidden rounded-2xl border border-border",
              item.tier === "grail" && "grail-card"
            )}
            onClick={() => gallery.length > 0 && setLightbox(imageIndex)}
          >
            <ItemImage
              item={item}
              src={gallery[imageIndex] ?? undefined}
              full
              className="aspect-[3/4] w-full"
            />
          </button>
          {gallery.length > 1 && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {gallery.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                    i === imageIndex ? "border-primary" : "border-transparent opacity-60"
                  )}
                >
                  <img src={url} referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <TierBadge tier={item.tier} />
              <StatusBadge status={item.status} />
              {item.batch && <BatchBadge batch={item.batch} />}
            </div>
            <h1 className="font-display text-2xl font-semibold leading-tight">{item.title}</h1>
            <p className="mt-2 font-display text-xl">
              {item.priceCNY != null ? formatCNY(item.priceCNY) : "No price"}
              {item.priceUSD != null && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ≈ {formatUSD(item.priceUSD)}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[item.brand, item.category, item.size && `Size ${item.size}`, `saved ${timeAgo(item.createdAt)}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          {/* tier picker */}
          <div>
            <SectionLabel>Tier</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {TIER_ORDER.map((t) => (
                <button
                  key={t}
                  onClick={() => patch({ tier: t as Tier })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    item.tier === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* status stepper */}
          <div>
            <SectionLabel>Status</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => patch({ status: s as ItemStatus })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    item.status === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                  title={STATUS_CONFIG[s].hint}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* rating */}
          <div>
            <SectionLabel>My rating</SectionLabel>
            <StarRating value={item.rating} onChange={(v) => patch({ rating: v })} />
          </div>

          {item.itemUrl && <AgentLinks itemUrl={item.itemUrl} />}

          {/* source links */}
          <div className="flex flex-wrap gap-2">
            {item.yupooUrl && (
              <a
                href={item.yupooUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs text-foreground hover:border-primary/50"
              >
                <ExternalLink className="h-3 w-3" /> Yupoo album
              </a>
            )}
            {item.sellerId && (
              <Link
                to={`/sellers/${item.sellerId}`}
                className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs text-foreground hover:border-primary/50"
              >
                <Store className="h-3 w-3" /> {item.sellerName || "Seller"}
              </Link>
            )}
          </div>

          {/* notes */}
          <div>
            <SectionLabel>Notes</SectionLabel>
            <Textarea
              value={notes ?? item.notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== null && notes !== item.notes) {
                  patch({ notes });
                  toast.success("Notes saved");
                }
              }}
              rows={3}
              placeholder="Sizing intel, batch comparisons, QC observations…"
            />
          </div>

          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete item
          </button>
        </div>
      </div>

      {/* reddit intel */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Reddit intel</SectionLabel>
          <button
            onClick={findOnReddit}
            disabled={searching}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/50"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Find on Reddit
          </button>
        </div>
        <div className="space-y-2.5">
          {refs.map((ref) => (
            <RedditPostCard key={ref.id} post={ref} onDelete={() => deleteRef.mutate(ref.id)} />
          ))}
          {redditResults &&
            redditResults
              .filter((p) => !refs.some((r) => r.permalink === p.permalink))
              .map((post) => (
                <RedditPostCard
                  key={post.redditId}
                  post={post}
                  action={
                    <button
                      onClick={() => attachPost(post)}
                      className="rounded-full border border-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-editorial text-primary"
                    >
                      Attach
                    </button>
                  }
                />
              ))}
          {refs.length === 0 && !redditResults && (
            <p className="text-xs text-muted-foreground">
              Attach QC threads and reviews so the intel lives with the item.
            </p>
          )}
        </div>
      </section>

      <ImageLightbox
        images={gallery}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={setLightbox}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{item.title}"?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                await deleteItems.mutateAsync([item.id]);
                toast.success("Deleted");
                navigate("/items");
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
