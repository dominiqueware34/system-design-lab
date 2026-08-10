-- Artifact 4 (#14) — competitive Campaign seasons + prompts.
-- Does NOT include solo_progress. Legacy campaign_progress (map) is separate.
--
-- SECURITY INVARIANTS (document + enforce):
-- 1. reference_design + rationale are SERVER-ONLY while season is live.
--    Column-level privileges revoke them from authenticated/anon.
--    Submit/evaluate API (Artifact 5) uses service role and must not return them.
-- 2. Clients never INSERT/UPDATE/DELETE seasons or prompts (service role / seed only).
-- 3. Public problem payload lives in problem JSONB (safe to read when season is live/ended).

-- ── campaign_seasons ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'live', 'ended')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  -- rules supports score_formula v1_correct_diff_cover and max_attempts: 3
  rules JSONB NOT NULL DEFAULT jsonb_build_object(
    'score_formula', 'v1_correct_diff_cover',
    'max_attempts', 3
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_seasons_slug_unique UNIQUE (slug),
  CONSTRAINT campaign_seasons_window_chk
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS campaign_seasons_status_idx
  ON public.campaign_seasons (status);

CREATE INDEX IF NOT EXISTS campaign_seasons_starts_at_idx
  ON public.campaign_seasons (starts_at DESC NULLS LAST);

COMMENT ON TABLE public.campaign_seasons IS
  'Competitive Campaign seasons (~3-day wall clock). status: draft|live|ended. '
  'rules JSONB includes score_formula (v1_correct_diff_cover) and max_attempts (3). '
  'No client writes — operators/service role only.';

COMMENT ON COLUMN public.campaign_seasons.slug IS
  'Stable URL/seed key, e.g. season-v1-draft. Unique.';

COMMENT ON COLUMN public.campaign_seasons.status IS
  'draft = not playable; live = open for submit; ended = LB frozen, refs may be revealed (Artifact 7).';

COMMENT ON COLUMN public.campaign_seasons.rules IS
  'Season rules. Expected keys: score_formula (text, default v1_correct_diff_cover), '
  'max_attempts (int, default 3). Extensible JSONB; submit API must honor these.';

COMMENT ON COLUMN public.campaign_seasons.starts_at IS
  'Season open time (UTC). ~3 days until ends_at for v1.';

COMMENT ON COLUMN public.campaign_seasons.ends_at IS
  'Season close time (UTC). After this, status should become ended (hardening Artifact 7).';

-- ── campaign_prompts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.campaign_seasons (id) ON DELETE CASCADE,
  -- Stable key from fixture (e.g. season-url-shortener); unique per season.
  prompt_key TEXT NOT NULL,
  -- Public DesignProblem-shaped payload (id, title, difficulty, track, summary, …).
  -- MUST NOT embed referenceDesign / rationale.
  problem JSONB NOT NULL,
  -- SERVER-ONLY while season is live. Never select via client JWT.
  reference_design JSONB NOT NULL,
  -- Teaching text for post-season reveal (also server-only while live).
  rationale TEXT,
  difficulty TEXT NOT NULL
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  track TEXT NOT NULL
    CHECK (track IN ('classic', 'agentic')),
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_prompts_season_key_unique UNIQUE (season_id, prompt_key),
  CONSTRAINT campaign_prompts_season_order_unique UNIQUE (season_id, sort_order)
);

CREATE INDEX IF NOT EXISTS campaign_prompts_season_id_idx
  ON public.campaign_prompts (season_id);

CREATE INDEX IF NOT EXISTS campaign_prompts_season_sort_idx
  ON public.campaign_prompts (season_id, sort_order);

COMMENT ON TABLE public.campaign_prompts IS
  'Season prompt set (v1: 20 per season). problem is client-safe; '
  'reference_design + rationale are server-only while status=live. '
  'Column grants + view enforce non-leak; API (Artifact 5) must not return refs mid-season.';

COMMENT ON COLUMN public.campaign_prompts.problem IS
  'Client-safe problem JSON (title, requirements, constraints, evaluationFocus, …). '
  'Do not store referenceDesign here.';

COMMENT ON COLUMN public.campaign_prompts.reference_design IS
  'INVARIANT: SERVER-ONLY while season is live. Hidden until season ends (PRODUCT + solo-vs-campaign.md). '
  'Revoked from authenticated/anon SELECT. Service role only. Never ship in client API responses while live.';

COMMENT ON COLUMN public.campaign_prompts.rationale IS
  'Reference teaching notes; same reveal policy as reference_design (server-only while live).';

COMMENT ON COLUMN public.campaign_prompts.difficulty IS
  'easy|medium|hard — drives diff_mult in v1_correct_diff_cover (1.0 / 1.35 / 1.75).';

COMMENT ON COLUMN public.campaign_prompts.track IS
  'classic|agentic content track.';

COMMENT ON COLUMN public.campaign_prompts.sort_order IS
  'Display/play order within the season (0-based or 1-based; seed uses 1..N).';

-- ── RLS: seasons ────────────────────────────────────────────────────────────
ALTER TABLE public.campaign_seasons ENABLE ROW LEVEL SECURITY;

-- Clients may read live + ended seasons only (not draft content).
DROP POLICY IF EXISTS "campaign_seasons_select_public_status" ON public.campaign_seasons;
CREATE POLICY "campaign_seasons_select_public_status"
  ON public.campaign_seasons
  FOR SELECT
  TO authenticated
  USING (status IN ('live', 'ended'));

-- No INSERT/UPDATE/DELETE policies for authenticated → clients cannot write.
-- service_role bypasses RLS for seed + operator tooling.

COMMENT ON POLICY "campaign_seasons_select_public_status" ON public.campaign_seasons IS
  'Authenticated users see live/ended seasons only. Draft seasons are service-role only.';

-- ── RLS: prompts ────────────────────────────────────────────────────────────
ALTER TABLE public.campaign_prompts ENABLE ROW LEVEL SECURITY;

-- Row visibility: only prompts belonging to live/ended seasons.
DROP POLICY IF EXISTS "campaign_prompts_select_live_or_ended" ON public.campaign_prompts;
CREATE POLICY "campaign_prompts_select_live_or_ended"
  ON public.campaign_prompts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaign_seasons s
      WHERE s.id = campaign_prompts.season_id
        AND s.status IN ('live', 'ended')
    )
  );

COMMENT ON POLICY "campaign_prompts_select_live_or_ended" ON public.campaign_prompts IS
  'Row-level: prompts only when parent season is live or ended. '
  'Column grants still hide reference_design/rationale from JWT clients.';

-- ── Column privileges: strip reference_design + rationale from client roles ──
-- Table owner (migration runner / postgres) keeps full access.
-- authenticated / anon must not SELECT secret columns even if they can read the row.
REVOKE ALL ON public.campaign_prompts FROM PUBLIC;
REVOKE ALL ON public.campaign_prompts FROM anon;
REVOKE ALL ON public.campaign_prompts FROM authenticated;

GRANT SELECT (
  id,
  season_id,
  prompt_key,
  problem,
  difficulty,
  track,
  sort_order,
  created_at
) ON public.campaign_prompts TO authenticated;

-- service_role bypasses RLS and has full table access via default Supabase grants.
-- Explicit grant for clarity in non-Supabase runners:
GRANT ALL ON public.campaign_prompts TO service_role;

-- Seasons: revoke write from clients; allow select (RLS filters rows).
REVOKE INSERT, UPDATE, DELETE ON public.campaign_seasons FROM authenticated;
REVOKE ALL ON public.campaign_seasons FROM anon;
GRANT SELECT ON public.campaign_seasons TO authenticated;
GRANT ALL ON public.campaign_seasons TO service_role;

-- ── Safe view (explicit client-facing shape; no reference columns) ──────────
CREATE OR REPLACE VIEW public.campaign_prompts_public
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.season_id,
  p.prompt_key,
  p.problem,
  p.difficulty,
  p.track,
  p.sort_order,
  p.created_at
FROM public.campaign_prompts p
INNER JOIN public.campaign_seasons s ON s.id = p.season_id
WHERE s.status IN ('live', 'ended');

COMMENT ON VIEW public.campaign_prompts_public IS
  'Client-safe prompt projection (no reference_design, no rationale). '
  'Prefer this view or column-limited SELECT in Artifact 5+ APIs while season is live.';

GRANT SELECT ON public.campaign_prompts_public TO authenticated;

-- ── updated_at on seasons ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_campaign_seasons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaign_seasons_set_updated_at ON public.campaign_seasons;
CREATE TRIGGER campaign_seasons_set_updated_at
  BEFORE UPDATE ON public.campaign_seasons
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_campaign_seasons_updated_at();
