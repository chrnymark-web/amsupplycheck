/**
 * Commercial-Intent Guide Articles Configuration
 * Each article targets BOFU search intent and links directly to suppliers.
 */

export interface GuideSection {
  type: 'text' | 'comparison_table' | 'supplier_cta' | 'key_takeaway';
  heading?: string;
  content?: string;
  /** For comparison_table: technology keys from TECHNOLOGY_GLOSSARY */
  technologies?: string[];
  /** For supplier_cta: pSEO slugs to link to */
  supplierSlugs?: { slug: string; label: string }[];
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface GuideArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  category: 'cost-comparison' | 'technology-comparison' | 'regional-guide' | 'specifications';
  comparisonTechnologies: string[];
  sections: GuideSection[];
  faqs: GuideFAQ[];
  relatedGuides: string[];
  supplierSlugs: string[];
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: 'sla-vs-sls-comparison',
    title: 'SLA vs SLS: Cost, Quality & Speed Comparison',
    metaTitle: 'SLA vs SLS Comparison – Cost, Quality & Speed | AMSupplyCheck',
    metaDescription: 'Compare SLA and SLS 3D printing: cost per part, surface quality, strength, and lead times. Find the right technology and supplier for your project.',
    h1: 'SLA vs SLS: Which 3D Printing Technology Saves You Money?',
    intro: 'Choosing between SLA and SLS affects your cost per part, surface finish, and mechanical performance. This data-driven comparison helps you decide — and connects you directly with verified suppliers for both technologies.',
    category: 'cost-comparison',
    comparisonTechnologies: ['SLA', 'SLS'],
    sections: [
      {
        type: 'text',
        heading: 'When to Choose SLA',
        content: 'SLA (Stereolithography) excels at producing parts with exceptionally smooth surfaces and fine details. It\'s the go-to for visual prototypes, jewelry masters, dental models, and any application where surface finish matters more than mechanical strength. SLA parts are typically more brittle and UV-sensitive, making them less suitable for functional end-use parts.',
      },
      {
        type: 'text',
        heading: 'When to Choose SLS',
        content: 'SLS (Selective Laser Sintering) produces strong, functional parts from nylon powder without support structures. This means complex geometries — interlocking parts, living hinges, internal channels — are all possible. SLS parts have a slightly rough, grainy surface but offer significantly better mechanical properties than SLA.',
      },
      { type: 'comparison_table', technologies: ['SLA', 'SLS'] },
      {
        type: 'key_takeaway',
        heading: 'Bottom Line',
        content: 'Choose SLA for visual prototypes and fine details. Choose SLS for functional parts and production runs. SLS typically costs less per part at volumes above 10 units due to efficient powder packing.',
      },
      {
        type: 'supplier_cta',
        supplierSlugs: [
          { slug: 'sla-3d-printing', label: 'SLA Suppliers' },
          { slug: 'sls-3d-printing', label: 'SLS Suppliers' },
        ],
      },
    ],
    faqs: [
      { question: 'Is SLA or SLS cheaper per part?', answer: 'For single prototypes, SLA is often cheaper. For batches above 10 parts, SLS becomes more cost-effective because parts can be densely packed in the powder bed without individual support structures.' },
      { question: 'Which has better surface finish — SLA or SLS?', answer: 'SLA produces significantly smoother surfaces (Ra 1-2 µm) compared to SLS (Ra 6-12 µm). SLS parts can be smoothed through vapor polishing or dyeing, but won\'t match raw SLA quality.' },
      { question: 'Can SLS parts be used in production?', answer: 'Yes. SLS PA-12 nylon parts are widely used in production applications including automotive, aerospace, and consumer goods. Many suppliers offer certified production-grade SLS.' },
    ],
    relatedGuides: ['nylon-sls-cost-per-part', 'fdm-vs-mjf-production', '3d-printing-tolerances'],
    supplierSlugs: ['sla-3d-printing', 'sls-3d-printing'],
  },
  {
    slug: 'nylon-sls-cost-per-part',
    title: 'How Much Does Nylon SLS Cost per Part?',
    metaTitle: 'Nylon SLS Cost per Part – Pricing Guide 2025 | AMSupplyCheck',
    metaDescription: 'Understand Nylon SLS 3D printing costs: price per part, volume discounts, material options, and how to get the best quotes from verified suppliers.',
    h1: 'Nylon SLS Pricing: How Much Does It Actually Cost per Part?',
    intro: 'Nylon SLS pricing varies significantly based on part size, complexity, volume, and supplier. This guide breaks down the real cost factors so you can budget accurately and find competitive quotes.',
    category: 'cost-comparison',
    comparisonTechnologies: ['SLS'],
    sections: [
      {
        type: 'text',
        heading: 'Key Cost Factors for Nylon SLS',
        content: 'SLS pricing is primarily driven by: (1) Part volume — the amount of material used, measured in cm³. (2) Bounding box — the space your part occupies in the build chamber. (3) Batch size — more parts per build = lower cost each. (4) Material choice — PA-12 is cheapest, glass-filled and carbon-filled nylons cost 30-80% more. (5) Post-processing — dyeing, vapor smoothing, or machining add cost.',
      },
      {
        type: 'text',
        heading: 'Typical Price Ranges',
        content: 'For a standard PA-12 nylon part (50×50×50 mm): Single prototype: €15-45. Batch of 10: €8-25 per part. Batch of 100+: €5-15 per part. These are indicative ranges — actual pricing depends on geometry complexity and supplier. Getting quotes from multiple suppliers is the best way to find competitive pricing.',
      },
      { type: 'comparison_table', technologies: ['SLS', 'Multi Jet Fusion', 'FDM'] },
      {
        type: 'key_takeaway',
        heading: 'How to Get the Best Price',
        content: 'Request quotes from at least 3 suppliers. Optimize part orientation for dense packing. Consider MJF as an alternative — it often matches SLS quality at lower cost for larger batches.',
      },
      {
        type: 'supplier_cta',
        supplierSlugs: [
          { slug: 'sls-3d-printing', label: 'SLS Suppliers' },
          { slug: 'nylon-3d-printing', label: 'Nylon Suppliers' },
          { slug: 'mjf-3d-printing', label: 'MJF Suppliers' },
        ],
      },
    ],
    faqs: [
      { question: 'What is the cheapest nylon for SLS?', answer: 'PA-12 (Nylon 12) is the most affordable SLS material, with well-established supply chains and recycling processes that keep powder costs down.' },
      { question: 'Is MJF cheaper than SLS for nylon parts?', answer: 'Often yes, especially for larger batches. HP Multi Jet Fusion uses a similar nylon powder but can achieve higher packing density and faster build times, resulting in 10-30% lower per-part costs at scale.' },
      { question: 'How do I reduce SLS costs?', answer: 'Design for dense packing (flat geometries), order in batches, choose standard PA-12, and minimize post-processing requirements. Some suppliers offer volume discounts starting at 50+ parts.' },
    ],
    relatedGuides: ['sla-vs-sls-comparison', 'fdm-vs-mjf-production', 'compare-3d-printing-prices'],
    supplierSlugs: ['sls-3d-printing', 'nylon-3d-printing', 'mjf-3d-printing'],
  },
  {
    slug: 'cnc-lead-times-europe',
    title: 'Lead Times for CNC Machining in Europe',
    metaTitle: 'CNC Machining Lead Times in Europe – What to Expect | AMSupplyCheck',
    metaDescription: 'Understand typical CNC machining lead times across Europe. Compare turnaround by country and find suppliers with rush services.',
    h1: 'CNC Machining Lead Times in Europe: What to Expect',
    intro: 'CNC lead times vary significantly across European suppliers — from 3 days for simple parts to 6+ weeks for complex assemblies. This guide helps you plan realistic timelines and find suppliers that match your deadline.',
    category: 'regional-guide',
    comparisonTechnologies: [],
    sections: [
      {
        type: 'text',
        heading: 'Typical Lead Times by Complexity',
        content: 'Simple parts (2.5D, single setup): 3-7 business days. Medium complexity (3-axis, multiple setups): 7-15 business days. Complex parts (5-axis, tight tolerances): 15-30 business days. Assemblies with multiple components: 20-45 business days. These timelines include programming, machining, and basic quality inspection.',
      },
      {
        type: 'text',
        heading: 'Lead Times by Country',
        content: 'Germany: Known for precision and reliability, typical 5-15 days. UK: Competitive turnaround, 5-12 days for standard parts. Netherlands: Fast-turnaround specialists, some offering 3-day service. Denmark & Scandinavia: Premium quality, 7-20 days. Eastern Europe (Poland, Czech Republic): Cost-effective, 10-20 days.',
      },
      {
        type: 'text',
        heading: 'How to Get Faster Turnaround',
        content: 'Look for suppliers with rush/express services — many can deliver simple parts in 24-72 hours at a premium. Provide complete technical drawings (not just 3D models). Specify material upfront. Use standard tolerances where possible (±0.1mm vs ±0.01mm makes a big difference in lead time).',
      },
      {
        type: 'supplier_cta',
        supplierSlugs: [
          { slug: 'cnc-machining', label: 'CNC Suppliers' },
          { slug: 'cnc-machining-germany', label: 'CNC in Germany' },
          { slug: 'cnc-machining-united-kingdom', label: 'CNC in UK' },
        ],
      },
    ],
    faqs: [
      { question: 'What is the fastest CNC turnaround in Europe?', answer: 'Some online CNC services (like Protolabs and Hubs/3D Hubs) offer 24-72 hour turnaround for simple parts. Traditional machine shops typically need 5+ business days minimum.' },
      { question: 'Does rush service cost more?', answer: 'Yes, typically 30-100% premium depending on the timeline. A part that normally takes 10 days might cost 50% more for 5-day delivery and 100% more for 3-day delivery.' },
      { question: 'Should I choose a local CNC supplier?', answer: 'For prototypes needing fast iteration, local suppliers reduce shipping time and enable site visits. For production runs, the best price/quality combination may be worth 1-2 extra shipping days.' },
    ],
    relatedGuides: ['3d-printing-tolerances', 'metal-3d-printing-comparison'],
    supplierSlugs: ['cnc-machining', 'cnc-machining-germany', 'cnc-machining-united-kingdom', 'cnc-machining-europe'],
  },
  {
    slug: '3d-printing-tolerances',
    title: '3D Printing Tolerances by Technology',
    metaTitle: '3D Printing Tolerances by Technology – Complete Guide | AMSupplyCheck',
    metaDescription: 'Compare dimensional tolerances across SLA, SLS, MJF, FDM, DMLS and more. Know what accuracy to expect before ordering.',
    h1: '3D Printing Tolerances: What Accuracy Can You Actually Expect?',
    intro: 'Dimensional accuracy varies dramatically between 3D printing technologies — from ±0.05mm with SLA to ±0.5mm with FDM. Understanding these tolerances prevents costly surprises and helps you choose the right technology.',
    category: 'specifications',
    comparisonTechnologies: ['SLA', 'SLS', 'Multi Jet Fusion', 'FDM', 'DMLS'],
    sections: [
      {
        type: 'text',
        heading: 'Tolerance Overview',
        content: 'SLA/DLP: ±0.05-0.15mm — Best dimensional accuracy for polymers. SLS: ±0.1-0.3mm — Good accuracy with slight warping on large flat surfaces. MJF: ±0.1-0.3mm — Similar to SLS, excellent consistency across build volume. FDM: ±0.2-0.5mm — Depends heavily on printer calibration and material. DMLS/SLM: ±0.05-0.2mm — High accuracy for metal, but requires stress relief.',
      },
      {
        type: 'text',
        heading: 'Factors That Affect Accuracy',
        content: 'Part size matters: tolerances are typically ±0.1mm + 0.1% of dimension length. Orientation in the build affects Z-axis vs XY accuracy. Post-processing (sintering, heat treatment) can cause shrinkage. Wall thickness below 1mm is challenging for all technologies. Holes and pins may need post-machining for tight fits.',
      },
      { type: 'comparison_table', technologies: ['SLA', 'SLS', 'Multi Jet Fusion', 'FDM', 'DMLS'] },
      {
        type: 'key_takeaway',
        heading: 'Practical Advice',
        content: 'For press fits and tight tolerances, always discuss with your supplier upfront. Most will recommend post-machining critical surfaces. Design with tolerance bands in mind — if you need ±0.05mm, you need SLA or post-machined metal AM.',
      },
      {
        type: 'supplier_cta',
        supplierSlugs: [
          { slug: 'sla-3d-printing', label: 'SLA (Best Accuracy)' },
          { slug: 'sls-3d-printing', label: 'SLS Suppliers' },
          { slug: 'dmls-3d-printing', label: 'Metal AM Suppliers' },
        ],
      },
    ],
    faqs: [
      { question: 'Which 3D printing technology has the best tolerances?', answer: 'SLA and DLP offer the best dimensional accuracy for polymer parts (±0.05mm). For metal, DMLS/SLM achieves ±0.05-0.1mm on small features.' },
      { question: 'Can 3D printed parts achieve injection molding tolerances?', answer: 'Standard injection molding achieves ±0.05-0.1mm. SLA can match this for small parts. For most AM technologies, you\'ll need post-machining on critical surfaces to achieve injection molding-level tolerances.' },
      { question: 'How do I specify tolerances for 3D printing?', answer: 'Use GD&T (Geometric Dimensioning and Tolerancing) on your drawings. Call out critical dimensions explicitly. Discuss with suppliers which surfaces need tight control — they can orient parts and add machining stock accordingly.' },
    ],
    relatedGuides: ['sla-vs-sls-comparison', 'metal-3d-printing-comparison', 'fdm-vs-mjf-production'],
    supplierSlugs: ['sla-3d-printing', 'sls-3d-printing', 'dmls-3d-printing', 'mjf-3d-printing', 'fdm-3d-printing'],
  },
  {
    slug: 'metal-3d-printing-comparison',
    title: 'Metal 3D Printing: DMLS vs SLM vs Binder Jetting',
    metaTitle: 'DMLS vs SLM vs Binder Jetting – Metal 3D Printing Comparison | AMSupplyCheck',
    metaDescription: 'Compare DMLS, SLM, and Binder Jetting for metal additive manufacturing. Cost, speed, density, and which to choose for your application.',
    h1: 'Metal 3D Printing: DMLS vs SLM vs Binder Jetting Compared',
    intro: 'Metal additive manufacturing is not one technology — it\'s several, each with different strengths. This comparison helps you choose between DMLS, SLM, and Binder Jetting based on your requirements for density, cost, and production volume.',
    category: 'technology-comparison',
    comparisonTechnologies: ['DMLS', 'SLM', 'Binder Jetting'],
    sections: [
      {
        type: 'text',
        heading: 'DMLS — The Industry Standard',
        content: 'Direct Metal Laser Sintering partially melts metal powder, producing parts with 95-99% density. It\'s the most widely available metal AM process with the broadest material selection. Best for: aerospace components, medical implants, complex geometries that can\'t be CNC machined.',
      },
      {
        type: 'text',
        heading: 'SLM — Full Density Metal',
        content: 'Selective Laser Melting fully melts the powder, achieving 99.5%+ density. This means better mechanical properties than DMLS, closer to wrought metal. Best for: critical structural parts, aerospace, energy sector components where maximum strength is required.',
      },
      {
        type: 'text',
        heading: 'Binder Jetting — Speed and Scale',
        content: 'Binder Jetting jets a binder onto metal powder, then sinters in a furnace. It\'s dramatically faster than laser-based methods and doesn\'t need support structures. However, parts shrink ~20% during sintering and achieve lower density (97-99%). Best for: high-volume production, cost-sensitive applications, larger parts.',
      },
      { type: 'comparison_table', technologies: ['DMLS', 'SLM', 'Binder Jetting'] },
      {
        type: 'supplier_cta',
        supplierSlugs: [
          { slug: 'dmls-3d-printing', label: 'DMLS Suppliers' },
          { slug: 'slm-3d-printing', label: 'SLM Suppliers' },
          { slug: 'binder-jetting', label: 'Binder Jetting Suppliers' },
          { slug: 'metal-3d-printing', label: 'All Metal AM' },
        ],
      },
    ],
    faqs: [
      { question: 'What is the cheapest metal 3D printing method?', answer: 'Binder Jetting is typically the cheapest for batches above 20 parts. For single prototypes, DMLS may be more cost-effective because it doesn\'t require a separate sintering step.' },
      { question: 'Which metal AM process gives the strongest parts?', answer: 'SLM produces the densest, strongest parts (99.5%+ density), closest to wrought metal properties. DMLS is close behind. Binder Jetting parts may have slightly lower mechanical properties depending on sintering conditions.' },
      { question: 'Can metal 3D printed parts be as good as CNC machined?', answer: 'In terms of material properties, SLM parts can match or exceed cast metal. However, surface finish and tolerances typically require post-machining on critical surfaces. The advantage of AM is in geometric freedom — internal channels, lattice structures, and topology-optimized shapes that CNC can\'t produce.' },
    ],
    relatedGuides: ['3d-printing-tolerances', 'cnc-lead-times-europe', 'sla-vs-sls-comparison'],
    supplierSlugs: ['dmls-3d-printing', 'slm-3d-printing', 'binder-jetting', 'metal-3d-printing'],
  },
  {
    slug: 'fdm-vs-mjf-production',
    title: 'FDM vs MJF for Production Parts',
    metaTitle: 'FDM vs MJF for Production – Which Is Better? | AMSupplyCheck',
    metaDescription: 'Compare FDM and MJF for production parts: cost, strength, surface finish, and volume capabilities. Find the right technology for your manufacturing needs.',
    h1: 'FDM vs MJF: Which Is Better for Production Parts?',
    intro: 'When scaling from prototyping to production, FDM and MJF serve different sweet spots. FDM offers material variety and large-part capability, while MJF delivers isotropic strength and lower per-part costs at volume. Here\'s how to choose.',
    category: 'technology-comparison',
    comparisonTechnologies: ['FDM', 'Multi Jet Fusion'],
    sections: [
      {
        type: 'text',
        heading: 'FDM for Production',
        content: 'FDM shines for: large parts (build volumes up to 1m+), high-performance materials (PEEK, ULTEM, carbon fiber), low-volume production (1-50 parts), and applications where material selection matters more than surface finish. FDM parts have visible layer lines and anisotropic strength (weaker between layers).',
      },
      {
        type: 'text',
        heading: 'MJF for Production',
        content: 'MJF excels at: medium to high volume runs (50-10,000+ parts), consistent mechanical properties (isotropic strength), complex geometries without support costs, and applications requiring good surface finish out of the machine. MJF is limited to nylon-based materials and produces only gray/black parts.',
      },
      { type: 'comparison_table', technologies: ['FDM', 'Multi Jet Fusion'] },
      {
        type: 'key_takeaway',
        heading: 'Decision Framework',
        content: 'Need PEEK/ULTEM/special materials? → FDM. Need 100+ identical parts in nylon? → MJF. Need parts larger than 380mm? → FDM. Need isotropic strength? → MJF. Budget-constrained prototyping? → FDM.',
      },
      {
        type: 'supplier_cta',
        supplierSlugs: [
          { slug: 'fdm-3d-printing', label: 'FDM Suppliers' },
          { slug: 'mjf-3d-printing', label: 'MJF Suppliers' },
        ],
      },
    ],
    faqs: [
      { question: 'Is MJF stronger than FDM?', answer: 'MJF PA-12 parts have isotropic strength (equal in all directions), while FDM parts are weaker between layers. In the Z-direction, MJF is typically 30-50% stronger than FDM with the same material.' },
      { question: 'At what volume does MJF become cheaper than FDM?', answer: 'For small parts (< 100cm³), MJF typically becomes cheaper at 10-20 parts. For larger parts, the crossover point may be higher. The key driver is MJF\'s ability to pack many parts efficiently in a single build.' },
      { question: 'Can FDM match MJF surface quality?', answer: 'Not out of the machine. FDM parts always show layer lines. With post-processing (sanding, vapor smoothing for ABS, or painting), FDM can approach MJF finish, but it adds cost and time.' },
    ],
    relatedGuides: ['sla-vs-sls-comparison', 'nylon-sls-cost-per-part', '3d-printing-tolerances'],
    supplierSlugs: ['fdm-3d-printing', 'mjf-3d-printing', 'nylon-3d-printing'],
  },
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find(g => g.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return GUIDE_ARTICLES.map(g => g.slug);
}

export const GUIDE_CATEGORIES: Record<string, { label: string; description: string }> = {
  'versus': { label: 'Head-to-Head Comparisons', description: 'Side-by-side matchups of the biggest manufacturing platforms' },
  'alternatives': { label: 'Platform Alternatives', description: 'Compare top manufacturing platforms and find the best fit for your project' },
  'regional-roundup': { label: 'Regional Guides', description: 'Best manufacturing services by region' },
  'category-roundup': { label: 'Service Roundups', description: 'Top platforms by technology and service type' },
  'cost-comparison': { label: 'Cost Comparisons', description: 'Understand pricing across technologies and materials' },
  'technology-comparison': { label: 'Technology Comparisons', description: 'Compare AM processes for your application' },
  'regional-guide': { label: 'Lead Time Guides', description: 'Lead times and suppliers by region' },
  'specifications': { label: 'Specifications & Tolerances', description: 'Technical data for informed decisions' },
};
