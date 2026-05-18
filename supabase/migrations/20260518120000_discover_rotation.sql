-- Discover-suppliers saturation fix: rotation pool + chained call support
--
-- Adds:
--   1. discovery_runs.parent_run_id — links a chained run (offset=20) to its parent
--   2. discovery_config.rotation_enabled — feature flag for LRU query rotation
--   3. discovery_config.chained_call_enabled — feature flag for fire-and-forget chained call
--
-- Flags default false so the function's behavior is unchanged on deploy.
-- Activate after smoke test:
--   UPDATE discovery_config SET rotation_enabled = true;
--   UPDATE discovery_config SET chained_call_enabled = true;

ALTER TABLE public.discovery_runs
  ADD COLUMN IF NOT EXISTS parent_run_id UUID REFERENCES public.discovery_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_discovery_runs_parent_run_id
  ON public.discovery_runs(parent_run_id);

ALTER TABLE public.discovery_config
  ADD COLUMN IF NOT EXISTS rotation_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chained_call_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.discovery_runs.parent_run_id IS
  'For chained discovery runs (offset>0): references the parent run (offset=0) that triggered this one.';
COMMENT ON COLUMN public.discovery_config.rotation_enabled IS
  'When true, discover-suppliers picks 20 queries from QUERY_POOL using LRU + category round-robin instead of running the static list.';
COMMENT ON COLUMN public.discovery_config.chained_call_enabled IS
  'When true and offset=0, discover-suppliers fires off a second invocation with offset=20 to process more queries in parallel within the 150s edge timeout.';
