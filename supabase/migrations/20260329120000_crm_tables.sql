-- CRM Pipeline Stages
CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  position INT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'blue',
  is_win BOOLEAN NOT NULL DEFAULT false,
  is_loss BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed pipeline stages
INSERT INTO crm_pipeline_stages (name, slug, position, color, is_win, is_loss) VALUES
  ('New', 'new', 0, '#3b82f6', false, false),
  ('Contacted', 'contacted', 1, '#8b5cf6', false, false),
  ('Quoted', 'quoted', 2, '#f59e0b', false, false),
  ('Negotiating', 'negotiating', 3, '#f97316', false, false),
  ('Won', 'won', 4, '#22c55e', true, false),
  ('Lost', 'lost', 5, '#ef4444', false, true);

-- CRM Labels
CREATE TABLE crm_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed some default labels
INSERT INTO crm_labels (name, color) VALUES
  ('Hot Lead', '#ef4444'),
  ('High Value', '#f59e0b'),
  ('Returning', '#22c55e'),
  ('Enterprise', '#8b5cf6');

-- CRM Deals (the kanban cards)
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES crm_pipeline_stages(id),
  title TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  technology TEXT,
  material TEXT,
  volume TEXT,
  project_description TEXT,
  supplier_context TEXT,
  source_page TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  deal_value NUMERIC(12,2),
  position INT NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_deals_stage ON crm_deals(stage_id);
CREATE INDEX idx_crm_deals_assigned ON crm_deals(assigned_to);
CREATE INDEX idx_crm_deals_quote ON crm_deals(quote_request_id);

-- CRM Deal Labels (junction)
CREATE TABLE crm_deal_labels (
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES crm_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, label_id)
);

-- CRM Comments
CREATE TABLE crm_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_comments_deal ON crm_comments(deal_id);

-- CRM Activity Log
CREATE TABLE crm_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_activity_deal ON crm_activity_log(deal_id);
CREATE INDEX idx_crm_activity_created ON crm_activity_log(created_at DESC);

-- RLS Policies (admin-only access)
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on crm_pipeline_stages" ON crm_pipeline_stages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on crm_labels" ON crm_labels
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on crm_deals" ON crm_deals
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on crm_deal_labels" ON crm_deal_labels
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on crm_comments" ON crm_comments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on crm_activity_log" ON crm_activity_log
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_deals_updated_at
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER crm_comments_updated_at
  BEFORE UPDATE ON crm_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automation: auto-create CRM deal from new quote request
CREATE OR REPLACE FUNCTION create_deal_from_quote()
RETURNS TRIGGER AS $$
DECLARE
  new_stage_id UUID;
  max_pos INT;
BEGIN
  SELECT id INTO new_stage_id FROM crm_pipeline_stages WHERE slug = 'new' LIMIT 1;

  SELECT COALESCE(MAX(position), 0) + 1000 INTO max_pos
  FROM crm_deals WHERE stage_id = new_stage_id;

  INSERT INTO crm_deals (
    quote_request_id, stage_id, title, contact_name, contact_email,
    technology, material, volume, project_description,
    supplier_context, source_page, position
  ) VALUES (
    NEW.id, new_stage_id,
    NEW.name || ' - Quote Request',
    NEW.name, NEW.email,
    NEW.technology_preference, NEW.material_preference, NEW.volume,
    NEW.project_description, NEW.supplier_context, NEW.source_page,
    max_pos
  );

  -- Log the auto-creation
  INSERT INTO crm_activity_log (deal_id, action, details)
  SELECT id, 'created', jsonb_build_object('source', 'quote_request', 'quote_request_id', NEW.id)
  FROM crm_deals WHERE quote_request_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_deal_from_quote
  AFTER INSERT ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION create_deal_from_quote();

-- Backfill: create deals from existing quote requests
DO $$
DECLARE
  new_stage_id UUID;
  rec RECORD;
  pos INT := 0;
BEGIN
  SELECT id INTO new_stage_id FROM crm_pipeline_stages WHERE slug = 'new' LIMIT 1;

  FOR rec IN SELECT * FROM quote_requests ORDER BY created_at ASC LOOP
    INSERT INTO crm_deals (
      quote_request_id, stage_id, title, contact_name, contact_email,
      technology, material, volume, project_description,
      supplier_context, source_page, position, created_at
    ) VALUES (
      rec.id, new_stage_id,
      rec.name || ' - Quote Request',
      rec.name, rec.email,
      rec.technology_preference, rec.material_preference, rec.volume,
      rec.project_description, rec.supplier_context, rec.source_page,
      pos, rec.created_at
    );
    pos := pos + 1000;
  END LOOP;
END $$;
