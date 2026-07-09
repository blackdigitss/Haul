// Claude-powered agent. Three actions:
//   chat         — streaming concierge with live RAG over the user's archive
//   vet_seller   — gathers Reddit evidence about a seller, returns a trust
//                  verdict + summary and stores it on the seller row
//   parse_import — messy pasted W2C/spreadsheet text -> clean item rows
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-8";
const REDDIT_UA = "web:haul-archive:v2.0 (personal haul tracker)";

const VOICE = `Write like a knowledgeable friend who's deep in the rep game — direct, practical, zero fluff.
Never use the words: delve, tapestry, journey, elevate, realm, captivating, vibrant, testament, boast, foster.
Use the community's vocabulary naturally (W2C, QC, GL/RL, batch, cook, agent, haul) without over-explaining it.`;

// ---------- JSON repair (truncation-safe extraction) ----------

function stripFences(s: string): string {
  return s.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
}

function extractJsonSpan(text: string, open: string, close: string): string | null {
  const s = stripFences(text);
  const start = s.indexOf(open);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") depth--;
    if (depth === 0 && i > start) return s.slice(start, i + 1);
  }
  // Truncated — try to repair by closing open brackets, dropping a partial tail.
  let tail = s.slice(start);
  const lastComplete = Math.max(tail.lastIndexOf("},"), tail.lastIndexOf("}"));
  if (lastComplete > 0) tail = tail.slice(0, lastComplete + 1);
  let opens = 0;
  inString = false;
  escape = false;
  for (const ch of tail) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{" || ch === "[") opens++;
    if (ch === "}" || ch === "]") opens--;
  }
  let repaired = tail;
  // Close in reverse order of the opening chars we saw (approximate: close } then ])
  while (opens > 0) {
    repaired += close === "]" && opens === 1 ? "]" : "}";
    opens--;
  }
  return repaired;
}

// deno-lint-ignore no-explicit-any
function parseJsonArray(text: string): any[] {
  const span = extractJsonSpan(text, "[", "]");
  if (!span) return [];
  try {
    const parsed = JSON.parse(span);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// deno-lint-ignore no-explicit-any
function parseJsonObject(text: string): any | null {
  const span = extractJsonSpan(text, "{", "}");
  if (!span) return null;
  try {
    return JSON.parse(span);
  } catch {
    return null;
  }
}

// ---------- Reddit evidence gathering (for vet_seller) ----------

// deno-lint-ignore no-explicit-any
async function redditSearch(q: string, subs: string[], time: string): Promise<any[]> {
  try {
    const subPath = subs.length > 0 ? `/r/${subs.join("+")}` : "";
    const params = new URLSearchParams({
      q,
      restrict_sr: subs.length > 0 ? "1" : "0",
      sort: "relevance",
      t: time,
      limit: "20",
      raw_json: "1",
    });
    const res = await fetch(`https://www.reddit.com${subPath}/search.json?${params}`, {
      headers: { "User-Agent": REDDIT_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    // deno-lint-ignore no-explicit-any
    return (data?.data?.children || []).map((c: any) => {
      const d = c.data || {};
      return {
        title: d.title || "",
        subreddit: d.subreddit || "",
        score: d.score ?? 0,
        numComments: d.num_comments ?? 0,
        permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
        snippet: (d.selftext || "").slice(0, 600),
        postedAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString().slice(0, 10) : "",
      };
    });
  } catch (e) {
    console.warn("reddit search failed", e);
    return [];
  }
}

// ---------- RAG context ----------

async function buildContext(sb: SupabaseClient, userId: string): Promise<string> {
  const [{ data: products }, { data: sellers }, { data: hauls }] = await Promise.all([
    sb
      .from("products")
      .select("title, price_cny, price_usd, tier, status, category, brand, batch, seller_name, rating, notes, tags")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    sb
      .from("sellers")
      .select("name, subdomain, vet_status, vet_summary, rating_quality, rating_accuracy, rating_communication, rating_shipping, rating_value, notes")
      .eq("user_id", userId)
      .limit(100),
    sb
      .from("hauls")
      .select("name, status, total_cny, total_usd, product_ids, shipping_method, notes")
      .eq("user_id", userId)
      .limit(50),
  ]);

  const lines: string[] = ["## Saved items"];
  for (const p of products || []) {
    const bits = [
      `**${p.title}**`,
      p.brand ? `brand: ${p.brand}` : "",
      p.category ? p.category : "",
      p.batch ? `batch: ${p.batch}` : "",
      p.price_cny ? `¥${p.price_cny}` : "",
      p.price_usd ? `$${p.price_usd}` : "",
      `tier: ${p.tier}`,
      p.status ? `status: ${p.status}` : "",
      p.seller_name ? `seller: ${p.seller_name}` : "",
      p.rating ? `rated ${p.rating}/5` : "",
      p.notes ? `notes: ${String(p.notes).slice(0, 150)}` : "",
    ].filter(Boolean);
    lines.push(`- ${bits.join(" | ")}`);
  }
  lines.push("\n## Sellers");
  for (const s of sellers || []) {
    const avg =
      [s.rating_quality, s.rating_accuracy, s.rating_communication, s.rating_shipping, s.rating_value]
        .filter((r) => r > 0)
        .reduce((a, b, _, arr) => a + b / arr.length, 0) || 0;
    lines.push(
      `- ${s.name} (${s.subdomain || "no subdomain"}) | vetting: ${s.vet_status || "unvetted"}${
        avg ? ` | avg rating ${avg.toFixed(1)}/5` : ""
      }${s.vet_summary ? ` | vet notes: ${String(s.vet_summary).slice(0, 200)}` : ""}`
    );
  }
  lines.push("\n## Hauls");
  for (const h of hauls || []) {
    lines.push(
      `- ${h.name} | ${h.status} | ${h.product_ids?.length || 0} items | ¥${h.total_cny || 0} (~$${
        h.total_usd || 0
      })${h.shipping_method ? ` | ${h.shipping_method}` : ""}`
    );
  }
  return lines.join("\n");
}

// ---------- actions ----------

// deno-lint-ignore no-explicit-any
async function handleChat(anthropic: Anthropic, sb: SupabaseClient, userId: string, body: any) {
  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (messages.length === 0) return jsonResponse({ error: "Missing messages" }, 400);

  const context = await buildContext(sb, userId);
  const system = `You are Haul AI, the concierge inside the user's personal haul-tracking app. You know their entire archive of saved items, sellers, and hauls (below). Help them decide what to cop, compare items, plan hauls, estimate shipping, and think through seller trust.

${VOICE}

When you reference one of the user's saved items, write its exact title in **bold** so the app can render an item card. Keep answers tight — a few sentences unless real analysis is asked for. If asked about something not in the archive, say so plainly.

# The user's archive
${context}`;

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    system,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

async function handleVetSeller(
  anthropic: Anthropic,
  sb: SupabaseClient,
  userId: string,
  // deno-lint-ignore no-explicit-any
  body: any
) {
  const sellerId = body.sellerId;
  if (!sellerId) return jsonResponse({ error: "Missing sellerId" }, 400);

  const { data: seller } = await sb
    .from("sellers")
    .select("*")
    .eq("id", sellerId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!seller) return jsonResponse({ error: "Seller not found" }, 404);

  const subs: string[] = Array.isArray(body.subs) && body.subs.length > 0
    ? body.subs.slice(0, 8)
    : ["FashionReps", "DesignerReps", "QualityReps", "RepVirgins"];

  const queries = [seller.name, seller.subdomain].filter(
    (q, i, arr) => q && arr.indexOf(q) === i
  );
  const evidence = (
    await Promise.all(queries.map((q: string) => redditSearch(q, subs, "all")))
  ).flat();
  // dedupe by permalink
  const seen = new Set<string>();
  const posts = evidence.filter((p) => {
    if (!p.permalink || seen.has(p.permalink)) return false;
    seen.add(p.permalink);
    return true;
  }).slice(0, 25);

  const prompt = `You are vetting a seller for someone buying rep fashion through shopping agents. Analyze the Reddit evidence and give a trust verdict.

Seller: "${seller.name}" (Yupoo subdomain: ${seller.subdomain || "unknown"})

Reddit search results across ${subs.join(", ")}:
${posts.length > 0 ? JSON.stringify(posts, null, 1) : "(no results found)"}

Weigh: recency, upvotes, whether posts are QC posts (good sign people actually buy), scam/warning threads, W2C replies naming this seller, and volume of mentions. A seller with zero mentions is simply unvetted, not suspicious. Be skeptical of generic name collisions — only count posts plausibly about THIS seller.

CRITICAL — shill detection. Rep sellers routinely astroturf Reddit with sockpuppets. Actively discount and call out:
- authors whose handle resembles the seller name or subdomain (self-promotion)
- the same author appearing repeatedly across these results pushing the seller
- zero-engagement posts (no upvotes, no comments) that read like ads ("best seller", "trust me", contact info in the post)
- suspiciously uniform praise with no photos/QC substance
Legit signal looks like: high-engagement QC posts with photo albums, warnings, mixed experiences, replies from established users. If most of the "positive" evidence looks astroturfed, say so explicitly in the summary and lean toward "unvetted" or "caution" — never let shill volume masquerade as community trust.

${VOICE}

Respond with ONLY a JSON object:
{
  "verdict": "community" | "caution" | "unvetted",
  "summary": "markdown summary, 3-8 sentences: what the community says, notable QC feedback, any red flags, and a bottom line",
  "sources": [{"permalink": "...", "title": "...", "subreddit": "...", "score": 0}]
}
Include at most 6 of the strongest sources. verdict "community" = clearly positive community signal, "caution" = red flags found, "unvetted" = not enough evidence.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => ("text" in b ? b.text : ""))
    .join("");
  const result = parseJsonObject(text);
  if (!result || !result.verdict) {
    return jsonResponse({ error: "AI returned unparseable result", raw: text }, 502);
  }

  const verdict = ["community", "caution", "unvetted", "trusted"].includes(result.verdict)
    ? result.verdict
    : "unvetted";

  await sb
    .from("sellers")
    .update({
      vet_status: verdict,
      vet_summary: String(result.summary || ""),
      vet_sources: Array.isArray(result.sources) ? result.sources.slice(0, 6) : [],
      vetted_at: new Date().toISOString(),
    })
    .eq("id", sellerId)
    .eq("user_id", userId);

  return jsonResponse({
    verdict,
    summary: result.summary,
    sources: result.sources || [],
    evidenceCount: posts.length,
  });
}

// deno-lint-ignore no-explicit-any
async function handleParseImport(anthropic: Anthropic, body: any) {
  const text = String(body.text || "").slice(0, 30000);
  if (!text.trim()) return jsonResponse({ error: "Missing text" }, 400);

  const prompt = `Parse this pasted haul/wishlist text into structured items. It may be a W2C list, spreadsheet rows, Discord messages, or free-form notes about rep fashion items.

For each distinct item extract:
- title (clean it: strip emoji and marketing fluff, keep brand + item + colorway)
- brand (canonical name, e.g. "Louis Vuitton" not "lv"; empty string if unknown)
- category (one of: Shoes, Bags, Tops, Bottoms, Outerwear, Accessories, Watches, Jewelry; empty if unclear)
- priceCNY (number or null — convert from "¥", "rmb", "yuan"; if only USD given, leave null and set priceUSD)
- priceUSD (number or null)
- batch (batch code like "LJR", "PK GOD" if mentioned, else null)
- size (string, empty if none)
- url (any yupoo/weidian/taobao link attached to this item, empty if none)
- sellerName (if a seller is named, empty if none)
- notes (any opinions/comments about the item, verbatim-ish, empty if none)

Respond with ONLY a JSON array of item objects. No prose.

Text to parse:
"""
${text}
"""`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content
    .filter((b) => b.type === "text")
    .map((b) => ("text" in b ? b.text : ""))
    .join("");
  const items = parseJsonArray(raw);
  return jsonResponse({ items });
}

// ---------- handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "AI is not configured yet — add ANTHROPIC_API_KEY as a Supabase secret." },
        503
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const anthropic = new Anthropic({ apiKey });

    const body = await req.json();
    const action = body.action || "chat";

    if (action === "chat") return await handleChat(anthropic, sb, userId, body);
    if (action === "vet_seller") return await handleVetSeller(anthropic, sb, userId, body);
    if (action === "parse_import") return await handleParseImport(anthropic, body);

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error("AI function error:", error);
    return jsonResponse({ error: String(error) }, 500);
  }
});
