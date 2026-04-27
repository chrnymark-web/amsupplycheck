-- Remove Alveo3D supplier record.
-- Verified against alveo3d.com (FR/EN/ES, all subpages) on 2026-04-27:
-- Alveo3D (legal entity FLEXEE SYSTEM ALVEO 3D, SIRET 84082818000041) is a French
-- manufacturer of air-filtration systems, HEPA H13/H14 filters, fume extractors,
-- custom radial blowers and 3D-printer enclosures -- NOT a 3D printing service
-- bureau. Per the SupplyCheck rule that the directory only lists service
-- providers, the row is removed.
--
-- All four junction tables (supplier_technologies, supplier_materials,
-- supplier_certifications, supplier_tags) declare ON DELETE CASCADE on
-- suppliers(id), so a single DELETE handles cleanup.

BEGIN;

DELETE FROM suppliers
WHERE id = '808fb74a-727a-43d1-a329-b18f8ebb4d74'
   OR supplier_id = 'alveo3d';

COMMIT;
