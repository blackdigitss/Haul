import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";
import {
  useDeleteSeller,
  useItems,
  useRedditRefs,
  useSeller,
  useSettings,
  useUpdateSeller,
  useAddRedditRef,
  useDeleteRedditRef,
} from "@/hooks/use-data";
import { vetSeller, searchReddit, type RedditPost } from "@/lib/services";
import { trustScore, TRUST_BAND_CONFIG } from "@/lib/trust";
import { analyzeShills } from "@/lib/shill";
import { TrustRing } from "@/components/sellers/TrustRing";
import { VET_CONFIG, type SellerRatings, type VetStatus } from "@/types";
import { VetBadge } from "@/components/shared/badges";
import { StarRating } from "@/components/shared/StarRating";
import { ItemCard } from "@/components/items/ItemCard";
import { RedditPostCard } from "@/components/reddit/RedditPostCard";
import { SectionLabel } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/utils";

const RATING_LABELS: Record<keyof SellerRatings, string> = {
  quality: "Quality",
  accuracy: "Accuracy vs photos",
  communication: "Communication",
  shipping: "Shipping speed",
  value: "Value",
};

export default function SellerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: seller, isLoading } = useSeller(id);
  const { data: items = [] } = useItems();
  const { data: settings } = useSettings();
  const { data: refs = [] } = useRedditRefs({ sellerId: id });
  const updateSeller = useUpdateSeller();
  const deleteSeller = useDeleteSeller();
  const addRef = useAddRedditRef();
  const deleteRef = useDeleteRedditRef();

  const [vetting, setVetting] = useState(false);
  const [mentions, setMentions] = useState<RedditPost[] | null>(null);
  const [searchingMentions, setSearchingMentions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  const sellerItems = useMemo(() => items.filter((i) => i.sellerId === id), [items, id]);
  const trust = useMemo(
    () => (seller ? trustScore(seller, sellerItems, refs.length) : null),
    [seller, sellerItems, refs.length]
  );
  const shillMap = useMemo(
    () =>
      mentions && seller ? analyzeShills(mentions, [seller.name, seller.subdomain]) : null,
    [mentions, seller]
  );

  if (isLoading) return <div className="img-loading h-96 rounded-2xl" />;
  if (!seller) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Seller not found.</p>
        <Link to="/sellers" className="text-sm text-primary">
          Back to sellers
        </Link>
      </div>
    );
  }

  const runVet = async () => {
    setVetting(true);
    try {
      const result = await vetSeller(seller.id, settings?.redditSubs ?? []);
      toast.success(`Vetting complete — ${VET_CONFIG[result.verdict as VetStatus]?.label ?? result.verdict}`);
      // refresh via update hook invalidation
      await updateSeller.mutateAsync({
        id: seller.id,
        vetStatus: result.verdict as VetStatus,
        vetSummary: result.summary,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Vetting failed");
    } finally {
      setVetting(false);
    }
  };

  const findMentions = async () => {
    setSearchingMentions(true);
    try {
      const posts = await searchReddit({
        q: seller.subdomain || seller.name,
        subs: settings?.redditSubs ?? [],
        limit: 15,
        time: "all",
      });
      setMentions(posts);
      if (posts.length === 0) toast.info("No mentions found.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearchingMentions(false);
    }
  };

  const setRating = (key: keyof SellerRatings, value: number) => {
    updateSeller.mutate({
      id: seller.id,
      ratings: { ...seller.ratings, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="flex items-start gap-4">
        {trust && <TrustRing trust={trust} size={68} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold">{seller.name}</h1>
            <VetBadge status={seller.vetStatus} />
          </div>
          <p className="mt-1 font-num text-xs text-muted-foreground">
            {trust ? `${TRUST_BAND_CONFIG[trust.band].label} · ` : ""}
            {sellerItems.length} items archived
            {seller.vettedAt ? ` · vetted ${timeAgo(seller.vettedAt)}` : ""}
          </p>
          {trust && trust.signals.length > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {trust.signals.join(" · ")}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {seller.yupooUrl && (
              <a
                href={seller.yupooUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/50"
              >
                <ExternalLink className="h-3 w-3" /> Yupoo
              </a>
            )}
            {seller.weidianUrl && (
              <a
                href={seller.weidianUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/50"
              >
                <Store className="h-3 w-3" /> Weidian
              </a>
            )}
            {seller.whatsapp && (
              <a
                href={`https://wa.me/${seller.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/50"
              >
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      <Tabs defaultValue="vetting">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vetting">Vetting</TabsTrigger>
          <TabsTrigger value="items">Items ({sellerItems.length})</TabsTrigger>
          <TabsTrigger value="ratings">My ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="vetting" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={runVet}
              disabled={vetting}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {vetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading Reddit…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> AI vet from Reddit
                </>
              )}
            </button>
            <button
              onClick={findMentions}
              disabled={searchingMentions}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:border-primary/50 disabled:opacity-60"
            >
              {searchingMentions ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Browse mentions
            </button>
          </div>

          {seller.vetSummary && (
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Trust report</SectionLabel>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>{seller.vetSummary}</ReactMarkdown>
              </div>
              {seller.vetSources.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {seller.vetSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.permalink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block truncate text-xs text-primary hover:underline"
                    >
                      r/{src.subreddit} · {src.title} ({src.score}↑)
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            {refs.map((ref) => (
              <RedditPostCard key={ref.id} post={ref} onDelete={() => deleteRef.mutate(ref.id)} />
            ))}
            {mentions &&
              mentions
                .filter((p) => !refs.some((r) => r.permalink === p.permalink))
                .map((post) => (
                  <RedditPostCard
                    key={post.redditId}
                    post={post}
                    shill={shillMap?.get(post)}
                    action={
                      <button
                        onClick={async () => {
                          await addRef.mutateAsync({
                            sellerId: seller.id,
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
                          toast.success("Attached to seller");
                        }}
                        className="rounded-full border border-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-editorial text-primary"
                      >
                        Attach
                      </button>
                    }
                  />
                ))}
          </div>

          <div>
            <SectionLabel>Private notes</SectionLabel>
            <Textarea
              value={notes ?? seller.notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== null && notes !== seller.notes) {
                  updateSeller.mutate({ id: seller.id, notes });
                  toast.success("Notes saved");
                }
              }}
              rows={3}
              placeholder="Order history, sizes that fit, discount codes…"
            />
          </div>
        </TabsContent>

        <TabsContent value="items" className="pt-4">
          {sellerItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No items from this seller yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sellerItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4 pt-4">
          {(Object.keys(RATING_LABELS) as (keyof SellerRatings)[]).map((key) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-sm">{RATING_LABELS[key]}</span>
              <StarRating value={seller.ratings[key]} onChange={(v) => setRating(key, v)} />
            </div>
          ))}
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete seller
          </button>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {seller.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their items stay in your archive, just unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                await deleteSeller.mutateAsync(seller.id);
                navigate("/sellers");
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
