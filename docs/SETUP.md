# Setting up the backend

The app is wired to the existing **haul-manager Supabase project**
(`xtdmwbbxuuudtsbhpqzp` — see `.env`), so your previously saved products, sellers, and
hauls carry straight over and Google login keeps working. Three steps finish the upgrade.

> No Supabase yet / want a fresh project? Create one at supabase.com, put its URL + anon
> key in `.env`, run the migrations from `supabase/migrations/` **in order**, create the
> storage buckets `product-images` (public), `product-thumbs` (public), `qc-photos`
> (private), then continue below.

## 1 · Apply the v2 schema upgrade (one paste)

Open the Supabase dashboard → **SQL Editor** → paste the contents of
[`supabase/migrations/20260708120000_haul_v2_upgrade.sql`](../supabase/migrations/20260708120000_haul_v2_upgrade.sql)
→ Run. It's idempotent — safe to run twice.

What it does: converts item tiers to the new taxonomy (`grail/cop/want/maybe/pass`),
adds the item lifecycle (`saved → planned → purchased → warehouse → shipped → delivered`),
adds seller vetting columns, creates the `reddit_refs` table, and extends settings.

## 2 · Deploy the edge functions

With the [Supabase CLI](https://supabase.com/docs/guides/cli) logged in
(`supabase login`, then `supabase link --project-ref xtdmwbbxuuudtsbhpqzp`):

```sh
supabase functions deploy scrape img-proxy ingest-images reddit ai
```

| Function | Job |
|---|---|
| `scrape` | Yupoo/Weidian/generic importer with 24h cache |
| `img-proxy` | Displays hotlink-protected images (Referer spoof) |
| `ingest-images` | Rehosts images to Storage + WebP thumbnails |
| `reddit` | Reddit search/thread proxy (browser can't call Reddit directly) |
| `ai` | Claude: streaming chat, seller vetting, bulk-import parsing |

## 3 · Add the AI secret

Dashboard → **Edge Functions → Secrets** (or CLI):

```sh
supabase secrets set ANTHROPIC_API_KEY=sk-ant-…
```

Get a key at console.anthropic.com. Optional: `ANTHROPIC_MODEL` to override the default
(`claude-opus-4-8`).

Everything except AI features and Reddit works without this step; the scrape/img
functions need no secrets beyond the defaults Supabase injects.

## Verify

1. `bun run dev`, sign in.
2. Paste any Yupoo album URL in **Add → Link** — title/price/images should appear.
3. Open a seller → **AI vet from Reddit** — a trust report should generate.
4. **Radar** → search "W2C" — results should stream in.

If a function 401s, redeploy it (the `config.toml` in this repo sets `verify_jwt = false`
because the functions verify the user token themselves).
