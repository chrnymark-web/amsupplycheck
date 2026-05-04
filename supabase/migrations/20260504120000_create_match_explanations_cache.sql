-- Cache for AI-generated match explanations.
-- The Trigger.dev tasks call Claude to write a 1-2 sentence "why this supplier
-- matches" blurb per (supplier × project) pair. The same supplier scored against
-- the same project signature produces the same blurb every time, so we hash the
-- inputs and reuse cached prose. Cuts repeat-search Anthropic cost to zero.

CREATE TABLE match_explanations_cache (
  signature TEXT PRIMARY KEY,
  explanation TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hit_count INT NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ
);

CREATE INDEX idx_match_explanations_created ON match_explanations_cache(created_at DESC);

-- Server-only table: writes and reads happen inside Trigger.dev tasks via the
-- service role key. No anon access.
ALTER TABLE match_explanations_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON match_explanations_cache
  FOR ALL USING (false) WITH CHECK (false);
