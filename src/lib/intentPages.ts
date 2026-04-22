/**
 * BOFU Intent Page Configuration
 * Defines content, filters, and FAQs for bottom-of-funnel search intent pages.
 */

export interface IntentPageFAQ {
  question: string;
  answer: string;
}

export interface IntentPageConfig {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  heroSubtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCta?: { text: string; link: string };
  faqs: IntentPageFAQ[];
  supplierFilter: 'instant_quote' | 'stl_upload' | 'near_me_3d' | 'price_compare' | 'near_me_cnc';
  showPriceComparison?: boolean;
  showNearMe?: boolean;
  cncOnly?: boolean;
  relatedSlugs: string[];
}

export const INTENT_PAGES: Record<string, IntentPageConfig> = {
  'instant-3d-printing-quotes': {
    slug: 'instant-3d-printing-quotes',
    h1: 'Get Instant 3D Printing Quotes',
    metaTitle: 'Instant 3D Printing Quotes | Compare 40+ Verified Suppliers',
    metaDescription: 'Get instant 3D printing quotes from verified suppliers. Compare prices, lead times, and capabilities across SLS, SLA, FDM, MJF, and metal 3D printing services.',
    heroSubtitle: 'Compare instant quotes from verified 3D printing suppliers. Upload your design, specify requirements, and receive competitive quotes — no waiting, no hassle.',
    ctaText: 'Get Matched with Suppliers',
    ctaLink: '/match',
    faqs: [
      {
        question: 'How fast can I get a 3D printing quote?',
        answer: 'Many of our listed suppliers offer instant online quoting systems. Simply upload your STL or STEP file, select your material and technology, and receive a price estimate within minutes. Some suppliers provide quotes in under 60 seconds.',
      },
      {
        question: 'What file formats are accepted for instant quotes?',
        answer: 'Most suppliers accept STL, STEP, OBJ, and 3MF files. STL is the most universally supported format. Some suppliers also accept IGES, Parasolid, and native CAD formats like SLDPRT or CATIA.',
      },
      {
        question: 'Are the quotes binding or estimates?',
        answer: 'Initial instant quotes are typically estimates based on geometry analysis. Final pricing may vary based on detailed review, post-processing requirements, and quantity. Most suppliers confirm the final price within 24 hours.',
      },
      {
        question: 'Can I compare quotes from multiple suppliers?',
        answer: 'Yes! Use our Project Matcher to describe your project and get matched with the most suitable suppliers. You can then request quotes from multiple suppliers simultaneously to compare pricing and lead times.',
      },
    ],
    supplierFilter: 'instant_quote',
    relatedSlugs: ['sls-3d-printing', 'sla-3d-printing', 'fdm-3d-printing', 'metal-3d-printing', 'mjf-3d-printing'],
  },

  'upload-stl-for-quote': {
    slug: 'upload-stl-for-quote',
    h1: 'Upload STL File for Manufacturing Quote',
    metaTitle: 'Upload STL for 3D Printing Quote | Instant Price Estimates',
    metaDescription: 'Upload your STL file and get instant 3D printing quotes. Compare prices from verified suppliers for SLS, SLA, FDM, MJF, and metal additive manufacturing.',
    heroSubtitle: 'Upload your STL file, select material and technology, and get instant quotes from verified manufacturing suppliers. From prototype to production — all in one place.',
    ctaText: 'Start Your Project Match',
    ctaLink: '/match',
    secondaryCta: { text: 'Browse All Suppliers', link: '/search' },
    faqs: [
      {
        question: 'What is an STL file?',
        answer: 'STL (Standard Tessellation Language) is the most common file format for 3D printing. It describes the surface geometry of a 3D object using triangular facets. Most CAD software can export to STL format.',
      },
      {
        question: 'What is the maximum file size for upload?',
        answer: 'File size limits vary by supplier, but most accept files up to 100-200 MB. For very large or complex models, some suppliers offer FTP upload or direct file sharing options.',
      },
      {
        question: 'Which materials can I choose from?',
        answer: 'Our suppliers offer 100+ materials including Nylon PA12, ABS, Resin, TPU, PEEK, Titanium, Aluminum, Stainless Steel, Inconel, and many more. Use our search filters to find suppliers offering your specific material.',
      },
      {
        question: 'How does the quoting process work?',
        answer: 'Step 1: Upload your STL file to the supplier\'s platform. Step 2: Select your preferred material and technology. Step 3: Choose quantity and finishing options. Step 4: Receive an instant price estimate. Many suppliers provide automated quotes within seconds.',
      },
    ],
    supplierFilter: 'stl_upload',
    relatedSlugs: ['nylon-3d-printing', 'resin-3d-printing', 'titanium-3d-printing', 'aluminum-3d-printing'],
  },

  '3d-printing-near-me': {
    slug: '3d-printing-near-me',
    h1: 'Find 3D Printing Suppliers Near You',
    metaTitle: '3D Printing Near Me | Find Local Suppliers in Your Region',
    metaDescription: 'Find 3D printing services near you. Browse verified local suppliers by country and region. Compare capabilities, technologies, and get quotes from nearby manufacturers.',
    heroSubtitle: 'Discover verified 3D printing suppliers in your region. Local manufacturing means faster delivery, easier communication, and reduced shipping costs.',
    ctaText: 'Find Suppliers in Your Area',
    ctaLink: '/match',
    faqs: [
      {
        question: 'Should I use a local or remote 3D printing supplier?',
        answer: 'Local suppliers offer advantages like faster shipping, easier site visits, and same-timezone communication. However, remote suppliers may offer better pricing or specialized technologies. For prototyping, local is often best. For production, the best capabilities may matter more than proximity.',
      },
      {
        question: 'Do 3D printing suppliers ship internationally?',
        answer: 'Yes, most professional 3D printing suppliers ship internationally. Shipping costs and times vary by location, part size, and urgency. Many European and US suppliers offer express shipping options for time-critical projects.',
      },
      {
        question: 'How do I choose between suppliers in my region?',
        answer: 'Consider: 1) Technology match — does the supplier offer the right printing technology? 2) Material availability — do they stock your required material? 3) Quality certifications — ISO, AS9100, etc. 4) Lead time and pricing. Use our comparison tools to evaluate these factors.',
      },
      {
        question: 'Can I visit a supplier before placing an order?',
        answer: 'Many suppliers welcome facility visits, especially for larger production projects. This can help you assess quality, discuss technical requirements in person, and build a long-term manufacturing relationship.',
      },
    ],
    supplierFilter: 'near_me_3d',
    showNearMe: true,
    relatedSlugs: ['germany', 'united-states', 'united-kingdom', 'europe', 'denmark', 'netherlands'],
  },

  'compare-3d-printing-prices': {
    slug: 'compare-3d-printing-prices',
    h1: 'Compare 3D Printing Prices Online',
    metaTitle: 'Compare 3D Printing Prices | Budget to Premium Suppliers',
    metaDescription: 'Compare 3D printing prices from verified suppliers. See pricing tiers from budget to premium, compare features like instant quotes and rush service, and find the best value.',
    heroSubtitle: 'Understand 3D printing pricing across different technologies and suppliers. From budget-friendly prototyping to premium aerospace-grade manufacturing — find the right price point for your project.',
    ctaText: 'Get Personalized Price Comparison',
    ctaLink: '/match',
    faqs: [
      {
        question: 'Why do 3D printing prices vary so much?',
        answer: 'Pricing depends on technology (FDM is cheapest, metal printing most expensive), material cost, part size and complexity, post-processing requirements, quantity, and lead time. Premium suppliers may also charge more for certifications, quality control, and engineering support.',
      },
      {
        question: 'What is the cheapest 3D printing technology?',
        answer: 'FDM/FFF is generally the most affordable technology, ideal for prototyping and simple parts. SLS and MJF offer good value for functional parts in medium volumes. Metal technologies like DMLS and SLM are the most expensive but necessary for high-performance applications.',
      },
      {
        question: 'How can I reduce my 3D printing costs?',
        answer: 'Key strategies: 1) Optimize your design for 3D printing (reduce support structures). 2) Choose the right technology — don\'t use metal if polymer works. 3) Order in larger quantities for volume discounts. 4) Compare multiple suppliers. 5) Consider lead time flexibility — rush orders cost more.',
      },
      {
        question: 'Do suppliers offer volume discounts?',
        answer: 'Yes, most suppliers offer tiered pricing for larger quantities. Some technologies like MJF and SLS are particularly cost-effective at higher volumes because multiple parts can be nested in a single build. Request quotes for your target quantity to see volume pricing.',
      },
    ],
    supplierFilter: 'price_compare',
    showPriceComparison: true,
    relatedSlugs: ['sls-3d-printing', 'fdm-3d-printing', 'mjf-3d-printing', 'metal-3d-printing'],
  },

  'cnc-machining-near-me': {
    slug: 'cnc-machining-near-me',
    h1: 'Find CNC Machining Suppliers Near You',
    metaTitle: 'CNC Machining Near Me | Find Local CNC Services',
    metaDescription: 'Find CNC machining services near you. Browse verified CNC milling, turning, and multi-axis machining suppliers by country and region.',
    heroSubtitle: 'Discover verified CNC machining suppliers in your region. From precision milling to multi-axis turning — find the right CNC partner for your manufacturing needs.',
    ctaText: 'Find CNC Suppliers Nearby',
    ctaLink: '/match',
    faqs: [
      {
        question: 'What CNC machining services are available?',
        answer: 'Our listed suppliers offer CNC milling (3-axis, 4-axis, 5-axis), CNC turning/lathe, CNC grinding, wire EDM, and multi-axis machining. Many also offer complementary services like surface finishing, anodizing, and heat treatment.',
      },
      {
        question: 'Should I use CNC or 3D printing for my parts?',
        answer: 'CNC machining offers tighter tolerances, better surface finish, and a wider range of metals. 3D printing excels at complex geometries, internal channels, and rapid prototyping. Many projects benefit from combining both — 3D print prototypes, CNC machine production parts.',
      },
      {
        question: 'What materials can be CNC machined?',
        answer: 'CNC machining works with virtually any solid material: aluminum alloys, stainless steel, titanium, brass, copper, engineering plastics (PEEK, Delrin, PTFE), and more. Material selection depends on your application requirements.',
      },
      {
        question: 'What tolerances can CNC machining achieve?',
        answer: 'Standard CNC machining achieves tolerances of ±0.05mm to ±0.1mm. Precision machining can reach ±0.01mm or tighter. 5-axis machining enables complex geometries in a single setup. Discuss your tolerance requirements with suppliers to confirm capabilities.',
      },
    ],
    supplierFilter: 'near_me_cnc',
    showNearMe: true,
    cncOnly: true,
    relatedSlugs: ['cnc-machining', 'cnc-machining-germany', 'cnc-machining-united-states', 'cnc-machining-europe'],
  },
};

export function getIntentPageBySlug(slug: string): IntentPageConfig | undefined {
  return INTENT_PAGES[slug];
}

export function getAllIntentPageSlugs(): string[] {
  return Object.keys(INTENT_PAGES);
}
