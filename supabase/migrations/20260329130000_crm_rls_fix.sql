-- Drop the admin-only policies and replace with authenticated user policies
-- The CRM is hidden behind a secret URL, so authenticated access is sufficient

DROP POLICY "Admin full access on crm_pipeline_stages" ON crm_pipeline_stages;
DROP POLICY "Admin full access on crm_labels" ON crm_labels;
DROP POLICY "Admin full access on crm_deals" ON crm_deals;
DROP POLICY "Admin full access on crm_deal_labels" ON crm_deal_labels;
DROP POLICY "Admin full access on crm_comments" ON crm_comments;
DROP POLICY "Admin full access on crm_activity_log" ON crm_activity_log;

CREATE POLICY "Authenticated access on crm_pipeline_stages" ON crm_pipeline_stages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on crm_labels" ON crm_labels
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on crm_deals" ON crm_deals
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on crm_deal_labels" ON crm_deal_labels
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on crm_comments" ON crm_comments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on crm_activity_log" ON crm_activity_log
  FOR ALL USING (auth.role() = 'authenticated');
