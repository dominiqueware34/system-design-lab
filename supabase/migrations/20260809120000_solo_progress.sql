-- Solo Mode multi-problem progress (Artifact 2 / #11).
-- localStorage key: sdl-solo-progress-v1
-- Migrates completed campaign_progress map levels into solo problem records when possible.

CREATE TABLE IF NOT EXISTS public.solo_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  problems JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_level_ids TEXT[] NOT NULL DEFAULT '{}',
  last_played_level_id TEXT,
  last_played_problem_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS solo_progress_updated_at_idx
  ON public.solo_progress (updated_at DESC);

ALTER TABLE public.solo_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "solo_progress_select_own" ON public.solo_progress;
CREATE POLICY "solo_progress_select_own"
  ON public.solo_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "solo_progress_insert_own" ON public.solo_progress;
CREATE POLICY "solo_progress_insert_own"
  ON public.solo_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "solo_progress_update_own" ON public.solo_progress;
CREATE POLICY "solo_progress_update_own"
  ON public.solo_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.solo_progress IS
  'Per-user Solo Mode multi-problem progress (bestScore, stars, durationMs per problem).';

-- Seed solo_progress from legacy campaign_progress (map level ids → problem ids).
-- Only inserts when user has no solo_progress row yet.
INSERT INTO public.solo_progress (
  user_id,
  problems,
  completed_level_ids,
  last_played_level_id,
  last_played_problem_id,
  updated_at
)
SELECT
  cp.user_id,
  (
    SELECT COALESCE(jsonb_object_agg(mapped.problem_id, mapped.rec), '{}'::jsonb)
    FROM (
      SELECT
        m.problem_id,
        jsonb_build_object(
          'bestScore',
          60 + GREATEST(0, LEAST(3, COALESCE((cp.stars ->> m.level_id)::int, 1)) - 1) * 12,
          'stars',
          GREATEST(1, LEAST(3, COALESCE((cp.stars ->> m.level_id)::int, 1))),
          'durationMs',
          0
        ) AS rec
      FROM unnest(COALESCE(cp.completed_level_ids, '{}'::text[])) AS lid(level_id)
      JOIN (
        VALUES
          ('w1-l1', 'url-shortener'),
          ('w1-l2', 'rate-limiter-service'),
          ('w1-l3', 'distributed-kv'),
          ('w2-l1', 'chat-system'),
          ('w2-l2', 'global-id-generator'),
          ('w2-l3', 'news-feed'),
          ('w2-l4', 'ride-sharing'),
          ('w3-l1', 'rag-support-agent'),
          ('w3-l2', 'research-agent-web'),
          ('w3-l3', 'parallel-research-team'),
          ('w4-l1', 'coding-agent-pr'),
          ('w4-l2', 'payment-system'),
          ('w4-l3', 'video-streaming'),
          ('w4-l4', 'enterprise-agent-platform'),
          ('w4-l5', 'eval-driven-agent-improvement')
      ) AS m(level_id, problem_id) ON m.level_id = lid.level_id
    ) mapped
  ) AS problems,
  '{}'::text[] AS completed_level_ids,
  NULL AS last_played_level_id,
  NULL AS last_played_problem_id,
  now() AS updated_at
FROM public.campaign_progress cp
WHERE NOT EXISTS (
  SELECT 1 FROM public.solo_progress sp WHERE sp.user_id = cp.user_id
)
AND COALESCE(cardinality(cp.completed_level_ids), 0) > 0;
