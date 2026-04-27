-- Remove Bruil supplier record.
-- Verified against bruil.nl on 2026-04-27. On 27 November 2025 Bruil published
-- the announcement "Beëindiging activiteiten 3D beton printen" at
-- https://www.bruil.nl/actuele-berichten/beeindiging-activiteiten-3d-beton-printen
-- formally ending the activities of Bruil prefab printing B.V.:
--   "Na een periode van pionieren en innoveren hebben wij besloten de
--    activiteiten van Bruil prefab printing B.V. te beëindigen."
-- The /prefab-printing landing page now redirects to that notice.
--
-- The Bruil parent group (HQ Keesomstraat 9, 6717 AH Ede; Bruil Groep Services
-- B.V., KVK 09050843) still trades, but its remaining product lines are
-- ready-mix concrete (Bruil mix), dry mortars, traditional mould-cast precast
-- (Bruil prefab) and the Coba finishing brand -- none of which are additive
-- manufacturing. The supplier therefore no longer fits SupplyCheck's scope and
-- the row is removed.
--
-- All junction tables (supplier_technologies, supplier_materials,
-- supplier_tags) declare ON DELETE CASCADE on suppliers(id), so a single
-- DELETE handles cleanup.

BEGIN;

DELETE FROM suppliers
WHERE id = '446acab4-a0c7-403c-9940-9e4ba6f6eef6'
   OR supplier_id = 'bruil';

COMMIT;
