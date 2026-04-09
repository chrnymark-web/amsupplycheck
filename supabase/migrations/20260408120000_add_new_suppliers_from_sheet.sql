-- New suppliers discovered from outreach spreadsheet, researched via Firecrawl
-- Added 2026-04-08

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('beamler', 'Beamler – Industrial 3D Printing On-Demand', 'https://www.beamler.com', false, false, 0, 0, 'Online 3D Printing Service with a global network of ISO 9001 partners. Specialized in 3D printing silicone, tungsten, tungsten carbide, copper, composites and technical ceramics.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('applied-rapid-technologies', 'Applied Rapid Technologies', 'https://artcorp.com', false, false, 0, 0, 'A subsidiary of Obsidian Solutions Group, Applied Rapid Technologies specializes in rapid prototyping and short-run production. They serve aerospace, consumer goods, medical devices, and defense sectors from Virginia, USA.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('hubs', 'Hubs (Protolabs Network)', 'https://www.hubs.com', false, false, 0, 0, 'Now part of Protolabs Network, Hubs provides instant quoting and on-demand manufacturing for custom parts including 3D printing, CNC machining, sheet metal fabrication, and injection molding from Amsterdam, Netherlands.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('rapid-prototyping-services', 'Rapid Prototyping Services', 'https://rapidps.com', false, false, 0, 0, 'Specializes in bringing CAD files and design ideas to life using Fused Deposition Modeling (FDM) on large industrial 3D printers. Focus on prototypes, low volume production parts, tooling, and fixturing.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('applications-3d', 'Applications 3D', 'https://applications3d.com', false, false, 0, 0, 'Provides expert services in 3D scanning, reverse engineering, inspection/quality control, CAD and product design, and 3D printing services from Metro Detroit, USA.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('eos', 'EOS – Professional 3D Printing Solutions', 'https://www.eos.info', false, false, 0, 0, 'World-leading provider of industrial 3D printing solutions, offering professional 3D printers, materials, and software for additive manufacturing in metals and polymers.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('pelagus', 'Pelagus – On-Demand Manufacturing', 'https://www.pelagus.com', false, false, 0, 0, 'Offers on-demand manufacturing for OEMs in maritime and energy sectors, ensuring consistent availability of legacy portfolio parts through additive manufacturing.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('3dos', '3DOS – Decentralized Manufacturing Network', 'https://3dos.io', false, false, 0, 0, 'The world''s largest decentralized on-demand manufacturing network, allowing anyone to upload a design, receive royalties, and have it made anywhere in the world through peer-to-peer 3D printing.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('formrise', 'FORMRISE', 'https://formrise.com', false, false, 0, 0, 'German additive manufacturing service provider specializing in laser sintering. Offers technology consulting, training, and reliable production of prototypes and components with 13 years of industry experience.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('maker-factory', 'Maker Factory', 'https://makerfactory.dk', false, false, 0, 0, 'Danish 3D printing service based in Varde, offering professional 3D printing for businesses and private customers. Provides rapid prototyping, functional components, and a wide range of materials including PLA, ESD Safe, and flame resistant options.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('fkm-sintertechnik', 'FKM Sintertechnik – Additive Manufacturing', 'https://www.fkm.net', false, false, 0, 0, 'High-end German 3D printing service offering SLS, HSS, MJF, and SLM technologies. Specializes in industrial plastics (PA12, PA11, PEEK, TPU) and metals (aluminium, stainless steel, tool steel, copper, Inconel, cobalt-chrome).')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('freeform-technologies', 'FreeFORM Technologies', 'https://www.freeformtech.com', false, false, 0, 0, 'Worldwide 3D printing services from St. Marys, PA. Specializes in additive metal manufacturing, toll debind & sintering, stereolithography, and fused filament fabrication with expert design engineering services.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('nami-3dp', 'NAMI – 3D Printing Company', 'https://www.nami3dp.com', false, false, 0, 0, 'A joint venture between DUSSUR and 3D Systems in Saudi Arabia, playing a pivotal role in Vision 2030 by introducing industrial 3D printing to the kingdom. Offers metal and polymer printing services.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('objective-3d', 'Objective 3D', 'https://www.objective3d.com.au', false, false, 0, 0, 'Australia''s one-stop solution for 3D printing services, offering specialized 3D printers, scanners, materials, and software for industries including medical, automotive, and aerospace.')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description)
VALUES ('voestalpine-am', 'voestalpine Additive Manufacturing', 'https://www.voestalpine.com/additive-manufacturing/en/', false, false, 0, 0, 'Experts in powder, design & manufacturing for additive manufacturing, offering complete end-to-end solutions from concept to component with a focus on tool steel and high-performance metal parts.')
ON CONFLICT (supplier_id) DO NOTHING;
