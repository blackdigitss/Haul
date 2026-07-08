-- HAUL v2 upgrade — additive on top of the existing haul-manager schema.
-- Safe to run repeatedly (idempotent). Paste into the Supabase SQL editor
-- or apply with `supabase db push`.

-- ————— products: tier moves from enum to text with the new taxonomy —————
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products'
      AND column_name = 'tier' AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN tier DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN tier TYPE text USING tier::text;
  END IF;
END $$;

ALTER TABLE public.products ALTER COLUMN tier SET DEFAULT 'want';
UPDATE public.products SET tier = 'cop'  WHERE tier = 'must-cop';
UPDATE public.products SET tier = 'pass' WHERE tier = 'drop';

-- ————— products: lifecycle + purchase-link columns —————
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'saved',
  ADD COLUMN IF NOT EXISTS item_url        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_platform text NOT NULL DEFAULT 'yupoo',
  ADD COLUMN IF NOT EXISTS size            text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS color           text NOT NULL DEFAULT '';

-- items already assigned to a haul are at least "planned"
UPDATE public.products SET status = 'planned'
WHERE haul_id IS NOT NULL AND status = 'saved';

CREATE INDEX IF NOT EXISTS idx_products_user_status
  ON public.products (user_id, status);

-- ————— sellers: vetting + extra links —————
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS weidian_url text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url  text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes       text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS vet_status  text        NOT NULL DEFAULT 'unvetted',
  ADD COLUMN IF NOT EXISTS vet_summary text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS vet_sources jsonb       NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vetted_at   timestamptz;

-- ————— user_settings: agent preference + reddit subs —————
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS preferred_agent text   NOT NULL DEFAULT 'allchinabuy',
  ADD COLUMN IF NOT EXISTS reddit_subs     text[] NOT NULL
    DEFAULT ARRAY['FashionReps','DesignerReps','QualityReps','RepVirgins'];

-- ————— reddit_refs: saved Reddit threads linked to sellers/items —————
CREATE TABLE IF NOT EXISTS public.reddit_refs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id    uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE CASCADE,
  reddit_id    text NOT NULL DEFAULT '',
  permalink    text NOT NULL,
  title        text NOT NULL DEFAULT '',
  subreddit    text NOT NULL DEFAULT '',
  author       text NOT NULL DEFAULT '',
  score        integer NOT NULL DEFAULT 0,
  num_comments integer NOT NULL DEFAULT 0,
  snippet      text NOT NULL DEFAULT '',
  posted_at    timestamptz,
  pinned       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permalink, seller_id, product_id)
);

ALTER TABLE public.reddit_refs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reddit_refs'
      AND policyname = 'Users manage own reddit refs'
  ) THEN
    CREATE POLICY "Users manage own reddit refs" ON public.reddit_refs
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reddit_refs_user    ON public.reddit_refs (user_id);
CREATE INDEX IF NOT EXISTS idx_reddit_refs_seller  ON public.reddit_refs (seller_id);
CREATE INDEX IF NOT EXISTS idx_reddit_refs_product ON public.reddit_refs (product_id);
