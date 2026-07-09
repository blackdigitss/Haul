import { AlertTriangle, ArrowUpRight, MessageSquare, Pin, Trash2, TrendingUp } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import type { ShillCheck } from "@/lib/shill";

export interface RedditCardData {
  title: string;
  subreddit: string;
  author?: string;
  score: number;
  numComments: number;
  permalink: string;
  snippet?: string;
  postedAt?: number | null;
  pinned?: boolean;
}

export function RedditPostCard({
  post,
  action,
  onDelete,
  shill,
}: {
  post: RedditCardData;
  action?: React.ReactNode;
  onDelete?: () => void;
  shill?: ShillCheck;
}) {
  return (
    <article
      className={cn(
        "card-lux rounded-2xl border border-border p-4 transition-colors hover:border-primary/30",
        post.pinned && "border-grail/40",
        shill?.suspicious && "border-vet-caution/50"
      )}
    >
      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-primary">r/{post.subreddit}</span>
        {post.postedAt ? <span>· {timeAgo(post.postedAt)}</span> : null}
        {post.pinned && <Pin className="h-3 w-3 text-grail" />}
      </div>
      <a href={post.permalink} target="_blank" rel="noreferrer noopener" className="group block">
        <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {post.title}
          <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 opacity-50" />
        </p>
      </a>
      {post.snippet && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{post.snippet}</p>
      )}
      {shill?.suspicious && (
        <div className="mt-2.5 rounded-lg border border-vet-caution/40 bg-vet-caution/10 px-3 py-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-editorial text-vet-caution">
            <AlertTriangle className="h-3.5 w-3.5" /> Possible shill
          </p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
            {shill.reasons.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> {post.score}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {post.numComments}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {action}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
