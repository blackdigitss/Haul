# HAUL — Master Plan

The definitive rebuild. One app that does for rep/fashion hauls what Gatekeeps does for fragrance:
save everything you want, know everything about who sells it, and make the buy/ship decision easy.

## What we learned from the three prior apps

| Source | What we keep | What we fix |
|---|---|---|
| **Haul v1** (Next.js + Firebase) | Tier×Status dual taxonomy, CNY price parser, auto-seller-from-URL, 5-axis seller ratings | Image caching was never built (hotlinked Yupoo images break), no Weidian support, drag-reorder bugs, no rules |
| **haul-manager** (Vite + Supabase) | Multi-strategy Yupoo scraper w/ confidence scores, img-proxy (Referer spoof), ingest-images (permanent Storage + WebP thumbs), shipping cost calculator, batch knowledge (LJR/GET/PK…), bulk ops + compare | react-query installed but unused (manual refetch everywhere), drifting denormalized totals, no pagination, dead code, no Reddit, no AI |
| **Gatekeeps** (the quality bar) | Centralized react-query hooks, HSL token design system, editorial typography, shimmer rank language, auth that survives PWA backgrounding, sessionStorage filter/scroll restore, AI edge functions (streaming chat w/ RAG, LLM bulk-parse w/ JSON repair), non-destructive enrichment, CSV/JSON export | n/a — this is the pattern donor |

## Product pillars

1. **Save anything in seconds** — paste a Yupoo album / Weidian item URL → scraped title, price (with confidence), images, seller auto-created; or bulk-paste a whole W2C list and let AI parse it.
2. **Images that never die** — every saved item's images are proxied for display (Referer-spoof) and permanently rehosted to Supabase Storage with WebP thumbs.
3. **Reddit is a first-class citizen** — a Radar page for W2C/QC searching across rep subs, seller vetting (mentions + AI trust summary stored on the seller), and thread refs attachable to items/sellers.
4. **Decide with numbers** — haul builder with live cost math (items + weight-based intl shipping + agent fee), per-item/per-kg breakdown, CNY⇄USD live rate.
5. **Agent-ready** — every item gets one-tap purchase links generated for AllChinaBuy, CNFans, Superbuy, Mulebuy (deterministic URL templates; you buy on the agent, never on Yupoo/Weidian).
6. **Agentic core** — a floating AI concierge with live RAG over your own items/sellers/hauls (streaming, interactive item cards in answers), AI seller vetting from Reddit evidence, AI bulk-import parsing.
7. **Premium feel** — "archive editorial" design language: ink & bone palette, persimmon accent, Space Grotesk display type, shimmer GRAIL badges, glass bottom nav, choreographed motion. Dark-first.

## Stack

Vite 5 + React 18 + TypeScript, Tailwind 3.4 + shadcn/ui, framer-motion, @tanstack/react-query 5,
react-router 6, Supabase (Postgres/Auth/Storage/Edge Functions), PWA. Vitest for pure logic,
Playwright for smoke/screenshots. Bun as package manager.

**Backend: reuse the live haul-manager Supabase project** (`xtdmwbbxuuudtsbhpqzp`). Google login
already works there (Lovable Cloud OAuth), the storage buckets exist, and your previously saved
products/sellers/hauls carry straight over. All schema changes are **additive** and shipped as an
idempotent migration (`supabase/migrations/…` + `docs/SETUP.md` one-paste SQL).

## Data model (additive on top of existing tables)

- `products` + `status` lifecycle (`saved → planned → purchased → warehouse → shipped → delivered`),
  `item_url` (Weidian/Taobao), `source_platform`, `size`, `color`, plus existing tier/batch/brand/QC columns.
- `sellers` + `weidian_url`, `vet_status` (`unvetted | community | trusted | caution`), `vet_summary`,
  `vet_sources jsonb`, `vetted_at`.
- **new** `reddit_refs` — saved Reddit threads linked to a seller and/or product (permalink, title,
  subreddit, score, num_comments, snippet, posted_at, pinned). RLS `auth.uid() = user_id`.
- `user_settings` + `preferred_agent`, `reddit_subs text[]`.
- Existing `scrape_cache`, `product_qc_photos`, buckets `product-images`/`product-thumbs`/`qc-photos` reused as-is.

## Edge functions (Deno, `verify_jwt=false` + manual JWT check, shared CORS helper)

1. `scrape` — universal importer: Yupoo album (JSON API → `__INITIAL_STATE__` → regex fallbacks,
   title cleaner, weighted price voting w/ confidence, batch/brand/category detection, 24h cache),
   Weidian item, generic OpenGraph fallback.
2. `img-proxy` — streams any Yupoo/Weidian image with spoofed Referer; the display-time CORS/hotlink fix.
3. `ingest-images` — rehosts up to 20 images to Storage + 320px WebP thumbs; fire-and-forget after save.
4. `reddit` — server-side Reddit JSON API proxy (search across subs, thread+comments fetch) — the
   browser can't call Reddit directly (no CORS), the function can.
5. `ai` — Claude-powered: streaming concierge chat with live collection RAG; seller vetting
   (Reddit evidence in → trust summary + verdict out, stored on the seller); bulk-import parsing
   (messy pasted text → clean item rows, truncation-safe JSON repair).

## Pages

`/login` (hero, Google + email/password) · `/` Home (greeting, stats, must-cop rail, haul pipeline,
recent saves) · `/items` (+`/items/:id`) grid/list, filters (tier/status/category/brand/batch/seller/price),
search, bulk-select, compare, lightbox gallery, QC photos, agent links, Reddit refs ·
`/sellers` (+`/sellers/:id`) ratings, catalog links, Vetting tab · `/hauls` (+`/hauls/:id`) cost
calculator, status timeline, share summary · `/radar` Reddit search & save · `/insights` analytics ·
`/settings` theme, rate, taxonomies, export JSON/CSV.

## Verification & delivery

- Pure logic unit-tested (price parser, agent link builder, filter/sort, weight/shipping math).
- `?demo=1` demo mode: seeded in-memory data + bypassed auth — lets Playwright screenshot every page
  and lets you preview the app before wiring Supabase.
- Production build + Playwright smoke run in CI-style before every push.
- `docs/SETUP.md`: one SQL paste + `supabase functions deploy` + two secrets (`ANTHROPIC_API_KEY`).
