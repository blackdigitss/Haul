# HAUL

Archive, vet, and ship your hauls. A personal app for tracking rep/fashion finds from
Yupoo & Weidian catalogs, vetting sellers through Reddit, and running the shipping math
on orders placed through agents (AllChinaBuy, CNFans, …).

**Try it instantly:** run the app and click *"Preview with demo data"* on the login
screen (or open `/?demo=1`) — the whole app works with seeded data, no backend needed.

## What it does

- **Save anything in seconds** — paste a Yupoo album or Weidian item link; the scraper
  pulls the title, price (with a confidence hint), images, batch/brand/category, and
  auto-creates the seller. Or bulk-paste a messy W2C list and let AI parse it.
- **Images that never die** — hotlink-protected images display through a Referer-spoofing
  proxy and get permanently rehosted to Supabase Storage with WebP thumbnails.
- **Reddit Radar with shill detection** — search the rep subs (W2C, QC, guides) from inside
  the app; results are automatically screened for self-promo patterns (author handle
  resembling a seller, one account flooding results, zero-engagement promo posts) and
  flagged before you trust a "review". Your sub list is editable in Settings.
- **Seller trust scores** — every seller gets a deterministic 0–100 trust ring computed
  from community vetting, your ratings, delivered orders, and saved research, plus
  "Best for Tops/Shoes/…" chips so you know who to use for what.
- **AI seller vetting** — one tap gathers Reddit evidence about a seller and Claude writes
  a trust report with a verdict badge, explicitly hunting astroturf/sockpuppet patterns.
- **Haul builder** — group items, pick a shipping line, and get live cost math using
  tiered agent rate cards (first-500g base + per-100g), a one-tap comparison of every
  line with cheapest/fastest flags, editable per-item weights, per-item/per-kg, and ETA.
- **⌘K command palette** — jump to any item, seller, or haul instantly.
- **Agent links** — every item with a Weidian/Taobao URL gets one-tap purchase links for
  AllChinaBuy, CNFans, Mulebuy, Superbuy, Sugargoo, and Hoobuy.
- **Haul AI** — a floating concierge that knows your whole archive (streamed answers,
  tappable item cards).
- **Insights & export** — spend by category, tier distribution, top sellers/brands,
  CSV + full JSON backup.

## Stack

Vite + React 18 + TypeScript · Tailwind + shadcn/ui · framer-motion · TanStack Query ·
Supabase (Postgres, Auth, Storage, Edge Functions) · Claude API · PWA.

## Development

```sh
bun install
bun run dev        # http://localhost:8080
bun run test       # vitest (pure-logic unit tests)
bun run build      # production build
node scripts/smoke.mjs   # Playwright page-by-page smoke test (needs `bun run preview` running)
```

## Setup (backend)

See [docs/SETUP.md](docs/SETUP.md) — one SQL paste + edge function deploy + two secrets.
The full product plan is in [docs/PLAN.md](docs/PLAN.md).
