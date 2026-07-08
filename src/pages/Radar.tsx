import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Radar as RadarIcon, Search } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RedditPostCard } from "@/components/reddit/RedditPostCard";
import { useAddRedditRef, useRedditRefs, useDeleteRedditRef, useSettings, useSellers } from "@/hooks/use-data";
import { searchReddit, type RedditPost } from "@/lib/services";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const QUICK_SEARCHES = ["W2C", "QC", "best batch", "shipping to US", "trusted seller list"];

export default function Radar() {
  const { data: settings } = useSettings();
  const { data: sellers = [] } = useSellers();
  const { data: savedRefs = [] } = useRedditRefs();
  const addRef = useAddRedditRef();
  const deleteRef = useDeleteRedditRef();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("relevance");
  const [time, setTime] = useState("year");
  const [results, setResults] = useState<RedditPost[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [attachSeller, setAttachSeller] = useState<string>("");

  const subs = settings?.redditSubs ?? [];

  const run = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setSearching(true);
    try {
      const posts = await searchReddit({ q: q.trim(), subs, sort, time, limit: 25 });
      setResults(posts);
      if (posts.length === 0) toast.info("Nothing found — try different terms.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const save = async (post: RedditPost) => {
    await addRef.mutateAsync({
      sellerId: attachSeller || null,
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
    toast.success(attachSeller ? "Saved and attached to seller" : "Saved to Radar");
  };

  return (
    <div>
      <PageHeader eyebrow={`r/${subs.join(" · r/")}`} title="Radar" />

      <div className="mb-4 space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(query);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search the rep subs — "W2C chrome hearts", a seller name…'
              className="w-full rounded-full border border-input bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
          {QUICK_SEARCHES.map((q) => (
            <button
              key={q}
              onClick={() => run(q)}
              className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="new">Newest</SelectItem>
              <SelectItem value="comments">Most comments</SelectItem>
            </SelectContent>
          </Select>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Past month</SelectItem>
              <SelectItem value="year">Past year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={attachSeller || "none"} onValueChange={(v) => setAttachSeller(v === "none" ? "" : v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Attach to…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No seller</SelectItem>
              {sellers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {results ? (
        <div className="space-y-2.5">
          {results.map((post) => {
            const alreadySaved = savedRefs.some((r) => r.permalink === post.permalink);
            return (
              <RedditPostCard
                key={post.redditId}
                post={post}
                action={
                  <button
                    onClick={() => !alreadySaved && save(post)}
                    disabled={alreadySaved}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-editorial",
                      alreadySaved
                        ? "border-border text-muted-foreground"
                        : "border-primary text-primary"
                    )}
                  >
                    {alreadySaved ? "Saved" : "Save"}
                  </button>
                }
              />
            );
          })}
        </div>
      ) : savedRefs.length > 0 ? (
        <>
          <SectionLabel>Saved threads</SectionLabel>
          <div className="space-y-2.5">
            {savedRefs.map((ref) => (
              <RedditPostCard key={ref.id} post={ref} onDelete={() => deleteRef.mutate(ref.id)} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={RadarIcon}
          title="Your community radar"
          hint="Search W2C threads, QC posts, and seller intel across the rep subs — then save the good ones to items and sellers."
        />
      )}
    </div>
  );
}
