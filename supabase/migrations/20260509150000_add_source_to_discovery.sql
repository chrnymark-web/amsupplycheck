-- Competitor directory crawler v1: schema additions
-- 1. Add `source` column to discovered_suppliers (was implicit 'search'-only before)
-- 2. Add `source` column to discovery_runs so we can filter runs per crawler
-- 3. Fix CHECK-constraint bug: discover-suppliers/index.ts already writes
--    status='auto_approved' but the original constraint only allowed
--    pending|approved|rejected|duplicate, which is a silent data-integrity bug.

ALTER TABLE discovered_suppliers
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'search';

CREATE INDEX IF NOT EXISTS idx_discovered_suppliers_source
  ON discovered_suppliers(source);

ALTER TABLE discovery_runs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'search';

CREATE INDEX IF NOT EXISTS idx_discovery_runs_source
  ON discovery_runs(source);

-- Fix the CHECK constraint to allow auto_approved
ALTER TABLE discovered_suppliers
  DROP CONSTRAINT IF EXISTS discovered_suppliers_status_check;

ALTER TABLE discovered_suppliers
  ADD CONSTRAINT discovered_suppliers_status_check
  CHECK (status IN ('pending','approved','rejected','duplicate','auto_approved'));
