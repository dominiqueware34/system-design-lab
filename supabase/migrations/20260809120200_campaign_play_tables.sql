-- Artifact 4 (#14) — play tables: sticky sessions, attempts, season scores.
--
-- SECURITY INVARIANTS:
-- 1. campaign_attempts + campaign_season_scores: NO client writes.
--    Artifact 5 submit API uses service_role to insert/recompute.
-- 2. duration_ms lives only on attempts (and sessions via started_at).
--    Public leaderboard MUST NOT expose duration (PRODUCT: time is private).
-- 3. campaign_prompt_sessions.started_at is sticky (set once; no client UPDATE).

-- ── campaign_prompt_sessions (sticky timer start) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_prompt_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.campaign_seasons (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.campaign_prompts (id) ON DELETE CASCADE,
  -- Sticky wall-clock start for private timer UX. Never a public LB field.
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_prompt_sessions_user_prompt_unique
    UNIQUE (user_id, season_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS campaign_prompt_sessions_user_season_idx
  ON public.campaign_prompt_sessions (user_id, season_id);

CREATE INDEX IF NOT EXISTS campaign_prompt_sessions_prompt_id_idx
  ON public.campaign_prompt_sessions (prompt_id);

COMMENT ON TABLE public.campaign_prompt_sessions IS
  'Sticky per-user per-prompt timer start for Campaign. '
  'started_at is PRIVATE (not on public LB, not in v1_correct_diff_cover). '
  'Clients may INSERT own row once; no UPDATE policy so started_at stays sticky.';

COMMENT ON COLUMN public.campaign_prompt_sessions.started_at IS
  'INVARIANT: sticky. First open wins. Private duration only — never public leaderboard.';

-- ── campaign_attempts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.campaign_seasons (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.campaign_prompts (id) ON DELETE CASCADE,
  attempt_number INT NOT NULL
    CHECK (attempt_number >= 1 AND attempt_number <= 3),
  design JSONB NOT NULL,
  -- AI stars 1–5 (scoring input ai_score for v1_correct_diff_cover).
  ai_score INT
    CHECK (ai_score IS NULL OR (ai_score >= 1 AND ai_score <= 5)),
  -- Denormalized star count (same scale as ai_score; kept explicit per artifact schema).
  stars INT
    CHECK (stars IS NULL OR (stars >= 1 AND stars <= 5)),
  -- prompt_points = ai_score × diff_mult (server-computed in Artifact 5).
  prompt_points NUMERIC(12, 4),
  -- PRIVATE elapsed for this attempt. Never select into public LB queries.
  duration_ms INT
    CHECK (duration_ms IS NULL OR duration_ms >= 0),
  formula_id TEXT NOT NULL DEFAULT 'v1_correct_diff_cover',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_attempts_user_prompt_attempt_unique
    UNIQUE (user_id, season_id, prompt_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS campaign_attempts_user_season_idx
  ON public.campaign_attempts (user_id, season_id);

CREATE INDEX IF NOT EXISTS campaign_attempts_prompt_id_idx
  ON public.campaign_attempts (prompt_id);

CREATE INDEX IF NOT EXISTS campaign_attempts_season_created_idx
  ON public.campaign_attempts (season_id, created_at DESC);

COMMENT ON TABLE public.campaign_attempts IS
  'Per-prompt submit attempts (max 3 via attempt_number + season rules). '
  'INVARIANT: no client INSERT/UPDATE/DELETE — service_role / Artifact 5 only. '
  'duration_ms is private; do not expose on public leaderboard.';

COMMENT ON COLUMN public.campaign_attempts.ai_score IS
  'AI evaluate stars 1–5 (input to v1_correct_diff_cover).';

COMMENT ON COLUMN public.campaign_attempts.stars IS
  'Star count for UX/aggregation; typically equals ai_score.';

COMMENT ON COLUMN public.campaign_attempts.prompt_points IS
  'Server: ai_score × diff_mult (easy 1.0 / medium 1.35 / hard 1.75).';

COMMENT ON COLUMN public.campaign_attempts.duration_ms IS
  'INVARIANT: PRIVATE. Not a term in season_score. Not a public LB column.';

COMMENT ON COLUMN public.campaign_attempts.formula_id IS
  'Scoring formula id at submit time (audit). Default v1_correct_diff_cover.';

COMMENT ON COLUMN public.campaign_attempts.attempt_number IS
  '1..3 inclusive. Enforced with max_attempts in season rules by submit API.';

-- ── campaign_season_scores ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_season_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.campaign_seasons (id) ON DELETE CASCADE,
  -- Leaderboard sort key: (Σ prompt_points) × coverage_mult
  season_score NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total_stars INT NOT NULL DEFAULT 0,
  prompts_scored INT NOT NULL DEFAULT 0,
  -- Map prompt_id or prompt_key → best attempt summary (no duration fields).
  best_by_prompt JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_score_at TIMESTAMPTZ,
  formula_id TEXT NOT NULL DEFAULT 'v1_correct_diff_cover',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_season_scores_user_season_unique
    UNIQUE (user_id, season_id)
);

CREATE INDEX IF NOT EXISTS campaign_season_scores_season_rank_idx
  ON public.campaign_season_scores (season_id, season_score DESC);

CREATE INDEX IF NOT EXISTS campaign_season_scores_user_id_idx
  ON public.campaign_season_scores (user_id);

COMMENT ON TABLE public.campaign_season_scores IS
  'Aggregated season score for leaderboard. '
  'INVARIANT: no client writes (service_role / Artifact 5 recompute on submit). '
  'No duration fields — public LB must not expose private timer.';

COMMENT ON COLUMN public.campaign_season_scores.season_score IS
  'Primary LB sort key for formula v1_correct_diff_cover.';

COMMENT ON COLUMN public.campaign_season_scores.total_stars IS
  'Sum of best-attempt stars across scored prompts (display).';

COMMENT ON COLUMN public.campaign_season_scores.prompts_scored IS
  'N in coverage_mult = 0.55 + 0.45 × (N / 20).';

COMMENT ON COLUMN public.campaign_season_scores.best_by_prompt IS
  'JSON map of per-prompt best scoring snapshot (stars, prompt_points, attempt_number). '
  'Must not store duration_ms here (keep private on attempts only).';

COMMENT ON COLUMN public.campaign_season_scores.last_score_at IS
  'Last improving submit time (tie-break candidate for Artifact 5/6).';

-- ── Public LB view (no duration) ────────────────────────────────────────────
CREATE OR REPLACE VIEW public.campaign_leaderboard
WITH (security_invoker = true)
AS
SELECT
  s.season_id,
  s.user_id,
  s.season_score,
  s.total_stars,
  s.prompts_scored,
  s.last_score_at,
  s.formula_id,
  s.updated_at,
  p.display_name,
  p.avatar_url
FROM public.campaign_season_scores s
LEFT JOIN public.profiles p ON p.id = s.user_id;

COMMENT ON VIEW public.campaign_leaderboard IS
  'Public leaderboard projection: scores + profile display fields. '
  'INVARIANT: no duration / started_at / duration_ms columns.';

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.campaign_prompt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_season_scores ENABLE ROW LEVEL SECURITY;

-- Sessions: own rows; insert once; no update (sticky started_at).
DROP POLICY IF EXISTS "campaign_prompt_sessions_select_own" ON public.campaign_prompt_sessions;
CREATE POLICY "campaign_prompt_sessions_select_own"
  ON public.campaign_prompt_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "campaign_prompt_sessions_insert_own" ON public.campaign_prompt_sessions;
CREATE POLICY "campaign_prompt_sessions_insert_own"
  ON public.campaign_prompt_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Intentionally NO UPDATE/DELETE policies for authenticated:
-- sticky started_at; service_role only for admin fixes.

COMMENT ON POLICY "campaign_prompt_sessions_insert_own" ON public.campaign_prompt_sessions IS
  'Players may create their own session row. No UPDATE policy → started_at is sticky.';

-- Attempts: own SELECT only; no client writes.
DROP POLICY IF EXISTS "campaign_attempts_select_own" ON public.campaign_attempts;
CREATE POLICY "campaign_attempts_select_own"
  ON public.campaign_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON POLICY "campaign_attempts_select_own" ON public.campaign_attempts IS
  'Players read own attempts. Writes only via service_role (Artifact 5). '
  'Clients must not surface duration_ms on public UI.';

-- Season scores: readable for LB (all authenticated); no client writes.
DROP POLICY IF EXISTS "campaign_season_scores_select_authenticated" ON public.campaign_season_scores;
CREATE POLICY "campaign_season_scores_select_authenticated"
  ON public.campaign_season_scores
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "campaign_season_scores_select_authenticated" ON public.campaign_season_scores IS
  'Public-within-auth leaderboard reads. No INSERT/UPDATE/DELETE for authenticated.';

-- Privileges: lock down writes for client roles.
REVOKE INSERT, UPDATE, DELETE ON public.campaign_attempts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.campaign_season_scores FROM authenticated;
REVOKE UPDATE, DELETE ON public.campaign_prompt_sessions FROM authenticated;
REVOKE ALL ON public.campaign_attempts FROM anon;
REVOKE ALL ON public.campaign_season_scores FROM anon;
REVOKE ALL ON public.campaign_prompt_sessions FROM anon;

GRANT SELECT ON public.campaign_attempts TO authenticated;
GRANT SELECT ON public.campaign_season_scores TO authenticated;
GRANT SELECT, INSERT ON public.campaign_prompt_sessions TO authenticated;
GRANT SELECT ON public.campaign_leaderboard TO authenticated;

GRANT ALL ON public.campaign_attempts TO service_role;
GRANT ALL ON public.campaign_season_scores TO service_role;
GRANT ALL ON public.campaign_prompt_sessions TO service_role;

-- updated_at on scores
CREATE OR REPLACE FUNCTION public.set_campaign_season_scores_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaign_season_scores_set_updated_at ON public.campaign_season_scores;
CREATE TRIGGER campaign_season_scores_set_updated_at
  BEFORE UPDATE ON public.campaign_season_scores
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_campaign_season_scores_updated_at();
