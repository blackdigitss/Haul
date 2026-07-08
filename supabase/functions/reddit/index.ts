// Server-side Reddit JSON API proxy. The browser can't call reddit.com
// directly (no CORS), so the app searches subs, vets sellers, and fetches
// threads through this function. Results are cached briefly in scrape_cache.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const UA = "web:haul-archive:v2.0 (personal haul tracker)";
const CACHE_MINUTES = 15;

interface RedditPost {
  redditId: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  permalink: string;
  url: string;
  snippet: string;
  thumbnail: string;
  postedAt: number;
}

// deno-lint-ignore no-explicit-any
function mapPost(child: any): RedditPost {
  const d = child.data || {};
  return {
    redditId: d.id || "",
    title: d.title || "",
    subreddit: d.subreddit || "",
    author: d.author || "",
    score: d.score ?? 0,
    numComments: d.num_comments ?? 0,
    permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
    url: d.url || "",
    snippet: (d.selftext || "").slice(0, 400),
    thumbnail:
      d.thumbnail && d.thumbnail.startsWith("http") ? d.thumbnail : "",
    postedAt: d.created_utc ? Math.round(d.created_utc * 1000) : 0,
  };
}

async function redditFetch(url: string): Promise<Response> {
  return await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
}

export async function searchReddit(
  q: string,
  subs: string[],
  sort: string,
  time: string,
  limit: number
): Promise<RedditPost[]> {
  const subPath = subs.length > 0 ? `/r/${subs.join("+")}` : "";
  const params = new URLSearchParams({
    q,
    restrict_sr: subs.length > 0 ? "1" : "0",
    sort,
    t: time,
    limit: String(Math.min(limit, 50)),
    raw_json: "1",
  });
  const res = await redditFetch(`https://www.reddit.com${subPath}/search.json?${params}`);
  if (!res.ok) throw new Error(`Reddit returned ${res.status}`);
  const data = await res.json();
  const children = data?.data?.children || [];
  // deno-lint-ignore no-explicit-any
  return children.map((c: any) => mapPost(c));
}

// deno-lint-ignore no-explicit-any
function mapComment(child: any, depth: number): any | null {
  if (!child || child.kind !== "t1") return null;
  const d = child.data || {};
  const replies: unknown[] = [];
  if (depth < 3 && d.replies?.data?.children) {
    for (const r of d.replies.data.children) {
      const mapped = mapComment(r, depth + 1);
      if (mapped) replies.push(mapped);
    }
  }
  return {
    author: d.author || "",
    score: d.score ?? 0,
    body: (d.body || "").slice(0, 2000),
    postedAt: d.created_utc ? Math.round(d.created_utc * 1000) : 0,
    replies,
  };
}

async function fetchThread(permalink: string) {
  const path = permalink.replace(/^https?:\/\/(www\.)?reddit\.com/, "").replace(/\/$/, "");
  const res = await redditFetch(`https://www.reddit.com${path}.json?raw_json=1&limit=60`);
  if (!res.ok) throw new Error(`Reddit returned ${res.status}`);
  const data = await res.json();
  const post = data?.[0]?.data?.children?.[0] ? mapPost(data[0].data.children[0]) : null;
  const fullText = data?.[0]?.data?.children?.[0]?.data?.selftext || "";
  const comments = (data?.[1]?.data?.children || [])
    // deno-lint-ignore no-explicit-any
    .map((c: any) => mapComment(c, 0))
    .filter(Boolean)
    .slice(0, 40);
  return { post: post ? { ...post, snippet: fullText.slice(0, 4000) } : null, comments };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const action = body.action || "search";

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "search") {
      const q = String(body.q || "").slice(0, 200);
      if (!q) return jsonResponse({ error: "Missing q" }, 400);
      const subs: string[] = Array.isArray(body.subs) ? body.subs.slice(0, 10) : [];
      const sort = ["relevance", "hot", "top", "new", "comments"].includes(body.sort)
        ? body.sort
        : "relevance";
      const time = ["hour", "day", "week", "month", "year", "all"].includes(body.time)
        ? body.time
        : "year";
      const limit = Number(body.limit) || 25;

      const cacheKey = `rd-${btoa(`${q}|${subs.join(",")}|${sort}|${time}`).slice(0, 100)}`;
      const { data: cached } = await sb
        .from("scrape_cache")
        .select("payload, created_at")
        .eq("album_id", cacheKey)
        .maybeSingle();
      if (cached) {
        const ageMin = (Date.now() - new Date(cached.created_at).getTime()) / 60000;
        if (ageMin < CACHE_MINUTES) return jsonResponse({ ...cached.payload, cached: true });
      }

      const posts = await searchReddit(q, subs, sort, time, limit);
      const payload = { posts };
      await sb.from("scrape_cache").upsert({
        album_id: cacheKey,
        payload,
        created_at: new Date().toISOString(),
      });
      return jsonResponse(payload);
    }

    if (action === "thread") {
      const permalink = String(body.permalink || "");
      if (!permalink.includes("/comments/")) {
        return jsonResponse({ error: "Invalid permalink" }, 400);
      }
      const result = await fetchThread(permalink);
      return jsonResponse(result);
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error("Reddit proxy error:", error);
    return jsonResponse({ error: String(error) }, 500);
  }
});
