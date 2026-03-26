-- New verified suppliers to import (not yet in database)
-- Source: Addidex (3) + Sharetribe (5) = 8 real new suppliers

-- From Addidex
INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('alpaxa-3d', 'ALPAXA 3D', 'https://www.alpaxa3d.com', false, false, 0, 0, 'Imported from Addidex supplier list')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('saeki', 'SAEKI', 'https://www.saeki-tech.com', false, false, 0, 0, 'Imported from Addidex supplier list')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('gardna-3d', 'Gardna 3D', 'https://www.gardna3d.com', false, false, 0, 0, 'Imported from Addidex supplier list')
ON CONFLICT (supplier_id) DO NOTHING;

-- From Sharetribe
INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('delva', 'Delva', 'https://delva.fi', false, false, 0, 0, 'Industrial Metal Additive Manufacturing & Co-Development. Imported from Sharetribe.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('markforged', 'Markforged', 'https://markforged.com', false, false, 0, 0, 'Industrial Additive Manufacturing Platform. Imported from Sharetribe.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('impac-additive-3d', 'Impac Additive 3D', 'https://impacsystems.com', false, false, 0, 0, 'Texas-Based Additive Manufacturing Service. Imported from Sharetribe.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('parts-on-demand', 'Parts On Demand', 'https://partsondemand.eu', false, false, 0, 0, 'Industrial 3D Printing & Digital Production. Imported from Sharetribe.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('easypartz', 'EasyPartz', 'https://easypartz.com', false, false, 0, 0, 'Online CNC Machining & Industrial Manufacturing. Imported from Sharetribe.')
ON CONFLICT (supplier_id) DO NOTHING;
