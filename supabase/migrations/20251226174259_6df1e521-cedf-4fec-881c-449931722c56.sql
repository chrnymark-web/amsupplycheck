-- Create search_analytics table to track user searches
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  extracted_technologies TEXT[] DEFAULT '{}',
  extracted_materials TEXT[] DEFAULT '{}',
  extracted_regions TEXT[] DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  clicked_supplier_ids TEXT[] DEFAULT '{}',
  session_id TEXT,
  search_type TEXT DEFAULT 'keyword', -- 'keyword', 'ai', 'project_match'
  search_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_match_analytics table to track project matching
CREATE TABLE public.ai_match_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_description TEXT NOT NULL,
  extracted_requirements JSONB DEFAULT '{}',
  matched_suppliers JSONB DEFAULT '[]',
  selected_supplier_id TEXT,
  match_score_avg NUMERIC,
  match_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_analytics table to track chat interactions
CREATE TABLE public.chat_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  topics_discussed TEXT[] DEFAULT '{}',
  suppliers_mentioned TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',
  user_satisfied BOOLEAN,
  conversation_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_match_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

-- Public insert policies (anyone can log analytics)
CREATE POLICY "Anyone can insert search analytics"
  ON public.search_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert match analytics"
  ON public.ai_match_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert chat analytics"
  ON public.chat_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update chat analytics"
  ON public.chat_analytics FOR UPDATE
  USING (true);

-- Admin-only read policies
CREATE POLICY "Admins can view search analytics"
  ON public.search_analytics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view match analytics"
  ON public.ai_match_analytics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view chat analytics"
  ON public.chat_analytics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for common queries
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at DESC);
CREATE INDEX idx_search_analytics_search_type ON public.search_analytics(search_type);
CREATE INDEX idx_ai_match_analytics_created_at ON public.ai_match_analytics(created_at DESC);
CREATE INDEX idx_chat_analytics_created_at ON public.chat_analytics(created_at DESC);
CREATE INDEX idx_chat_analytics_session_id ON public.chat_analytics(session_id);