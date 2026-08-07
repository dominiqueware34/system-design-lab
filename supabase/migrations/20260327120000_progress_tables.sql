-- Campaign + training progress for signed-in users (Supabase Auth).
-- Run in Supabase SQL Editor or via CLI. RLS: users only touch their own rows.

-- ── Campaign progress (replaces localStorage sdl-campaign-progress-v1 when signed in) ──
CREATE TABLE IF NOT EXISTS public.campaign_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  completed_level_ids TEXT[] NOT NULL DEFAULT '{}',
  stars JSONB NOT NULL DEFAULT '{}'::jsonb,
  wrenches_survived INT NOT NULL DEFAULT 0,
  last_played_level_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Training progress (replaces localStorage sdl-training-progress-v1 when signed in) ──
CREATE TABLE IF NOT EXISTS public.training_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  last_lesson_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_progress_updated_at_idx
  ON public.campaign_progress (updated_at DESC);

CREATE INDEX IF NOT EXISTS training_progress_updated_at_idx
  ON public.training_progress (updated_at DESC);

ALTER TABLE public.campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- campaign_progress policies
DROP POLICY IF EXISTS "campaign_progress_select_own" ON public.campaign_progress;
CREATE POLICY "campaign_progress_select_own"
  ON public.campaign_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "campaign_progress_insert_own" ON public.campaign_progress;
CREATE POLICY "campaign_progress_insert_own"
  ON public.campaign_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "campaign_progress_update_own" ON public.campaign_progress;
CREATE POLICY "campaign_progress_update_own"
  ON public.campaign_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- training_progress policies
DROP POLICY IF EXISTS "training_progress_select_own" ON public.training_progress;
CREATE POLICY "training_progress_select_own"
  ON public.training_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "training_progress_insert_own" ON public.training_progress;
CREATE POLICY "training_progress_insert_own"
  ON public.training_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "training_progress_update_own" ON public.training_progress;
CREATE POLICY "training_progress_update_own"
  ON public.training_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.campaign_progress IS 'Per-user campaign map progress (levels, stars, wrenches).';
COMMENT ON TABLE public.training_progress IS 'Per-user training lesson completions.';
