-- Replace craftcloud3d.com placeholder URLs with real supplier websites
-- on CraftCloud vendors that were imported without a researched website.
--
-- Runtime code treats website = 'https://craftcloud3d.com' as "no real site"
-- and falls back to the marketplace URL in the live-quote link. Updating these
-- rows lets the quote's external-link icon point to the supplier directly.
--
-- 9 vendors confirmed via web research (remaining 12 placeholders kept as-is
-- because no confident match was found — see docs/craftcloud-vendor-audit.md).

UPDATE suppliers SET website = 'https://www.3dave.nl',              updated_at = now() WHERE supplier_id = '3dave';
UPDATE suppliers SET website = 'https://3d-easyprint.ch',           updated_at = now() WHERE supplier_id = '3deasyprint';
UPDATE suppliers SET website = 'https://imagination3d.ro',          updated_at = now() WHERE supplier_id = 'imagination3d';
UPDATE suppliers SET website = 'http://www.j3darg.com',             updated_at = now() WHERE supplier_id = 'j3d-ar';
UPDATE suppliers SET website = 'https://www.kreativ-3d.de',         updated_at = now() WHERE supplier_id = 'kreativ-3d';
UPDATE suppliers SET website = 'https://www.m3db.it',               updated_at = now() WHERE supplier_id = 'mdb-m3db';
UPDATE suppliers SET website = 'https://mlcsolutions.at',           updated_at = now() WHERE supplier_id = 'mlc-solutions';
UPDATE suppliers SET website = 'https://netsheipasam.com',          updated_at = now() WHERE supplier_id = 'netsheipas-am';
UPDATE suppliers SET website = 'http://www.shenzhen3dinnovate.com', updated_at = now() WHERE supplier_id = 'shenzhen-3d-innovate';
