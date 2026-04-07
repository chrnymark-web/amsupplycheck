-- Search results table for persisting Trigger.dev workflow outputs
CREATE TYPE search_type AS ENUM ('requirement', 'stl');
CREATE TYPE search_status AS ENUM ('pending', 'analyzing', 'matching', 'ranking', 'completed', 'failed');

CREATE TABLE search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_run_id TEXT,
  search_type search_type NOT NULL,
  status search_status NOT NULL DEFAULT 'pending',

  -- Input data
  project_requirements JSONB,
  stl_file_url TEXT,
  stl_metrics JSONB,
  selected_technology TEXT,
  selected_material TEXT,

  -- Output data
  extracted_requirements JSONB,
  matches JSONB,
  technology_rationale JSONB,
  total_suppliers_analyzed INT,

  -- Metadata
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_search_results_trigger_run ON search_results(trigger_run_id);
CREATE INDEX idx_search_results_status ON search_results(status);
CREATE INDEX idx_search_results_created ON search_results(created_at DESC);

-- RLS
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- Anyone can read results (fetched by trigger_run_id from frontend)
CREATE POLICY "Allow anonymous read" ON search_results
  FOR SELECT USING (true);

-- Only service role can insert/update (from Trigger.dev tasks via service key)
CREATE POLICY "Service role can insert" ON search_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update" ON search_results
  FOR UPDATE USING (true);
