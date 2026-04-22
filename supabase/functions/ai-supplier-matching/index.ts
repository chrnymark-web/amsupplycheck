import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Strip non-alphanumerics so "PA-12" and "PA12 Nylon" both reduce to "pa12"-containing keys
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(a: string, b: string): boolean {
  const la = normalizeKey(a);
  const lb = normalizeKey(b);
  if (!la || !lb) return false;
  return la.includes(lb) || lb.includes(la);
}

// Weight factors for matching - certification weight increased
const WEIGHTS = {
  technology: 0.30,
  material: 0.25,
  location: 0.10,
  certification: 0.20,
  capacity: 0.15,
};

// Mappings from user requirements to suitable technologies/materials
const INDUSTRY_TO_TECHNOLOGIES: Record<string, string[]> = {
  'automotive': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM', 'Carbon Fiber'],
  'aerospace': ['DMLS', 'SLM', 'SLS', 'Titanium', 'Inconel', 'Aluminum'],
  'medical': ['SLA', 'SLS', 'DMLS', 'Biocompatible', 'Titanium'],
  'food': ['SLS', 'Multi Jet Fusion', 'PA-11', 'PP', 'FDA'],
  'consumer-electronics': ['SLS', 'Multi Jet Fusion', 'SLA', 'Material Jetting'],
  'industrial': ['SLS', 'FDM', 'Multi Jet Fusion', 'DMLS'],
  'architecture': ['SLA', 'Material Jetting', 'Binder Jetting', 'FDM'],
  'consumer-goods': ['SLS', 'Multi Jet Fusion', 'SLA', 'Material Jetting'],
};

const MECHANICAL_TO_TECHNOLOGIES: Record<string, string[]> = {
  'high-strength': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM', 'Carbon Fiber', 'Nylon'],
  'heat-resistant': ['ULTEM', 'PEEK', 'DMLS', 'SLM', 'Inconel', 'Titanium'],
  'chemical-resistant': ['PETG', 'PP', 'PA-11', 'PEEK', 'Stainless Steel'],
  'wear-resistant': ['Nylon', 'PEEK', 'Carbon Fiber', 'Metal'],
  'flexibility': ['TPU', 'Flexible Resin', 'Rubber'],
  'lightweight': ['SLS', 'Multi Jet Fusion', 'Aluminum', 'Carbon Fiber'],
  'watertight': ['SLA', 'SLS', 'Multi Jet Fusion', 'Metal'],
};

const SURFACE_TO_TECHNOLOGIES: Record<string, string[]> = {
  'standard': ['FDM', 'SLS', 'Multi Jet Fusion'],
  'smooth': ['SLA', 'Material Jetting', 'DLP', 'PolyJet'],
  'cosmetic': ['SLA', 'Material Jetting', 'PolyJet'],
  'sterilizable': ['SLA', 'DMLS', 'SLM', 'Autoclave'],
  'painted': ['SLS', 'Multi Jet Fusion', 'SLA', 'FDM'],
};

const SIZE_TO_TECHNOLOGIES: Record<string, string[]> = {
  'small': ['SLA', 'DLP', 'Material Jetting', 'DMLS', 'SLS'],
  'medium': ['SLS', 'Multi Jet Fusion', 'SLA', 'FDM', 'DMLS'],
  'large': ['FDM', 'SLS', 'Binder Jetting'],
  'very-large': ['Large-format FDM', 'WAAM', 'BAAM'],
};

const APPLICATION_TO_TECHNOLOGIES: Record<string, string[]> = {
  'functional-prototype': ['SLS', 'Multi Jet Fusion', 'FDM', 'SLA'],
  'visual-prototype': ['SLA', 'Material Jetting', 'PolyJet', 'DLP'],
  'end-use-production': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM', 'SAF'],
  'tooling-fixtures': ['FDM', 'SLS', 'Multi Jet Fusion', 'DMLS'],
  'replacement-part': ['SLS', 'FDM', 'DMLS', 'Multi Jet Fusion'],
  'medical-device': ['SLA', 'DMLS', 'SLM', 'Biocompatible'],
};

const INDUSTRY_TO_CERTIFICATIONS: Record<string, string[]> = {
  'automotive': ['IATF 16949', 'ISO 9001'],
  'aerospace': ['AS9100', 'NADCAP', 'ISO 9001'],
  'medical': ['ISO 13485', 'FDA', 'ISO 9001'],
  'food': ['FDA', 'Food-grade', 'ISO 9001'],
  'consumer-electronics': ['UL', 'ISO 9001'],
  'industrial': ['ISO 9001'],
};

interface ProjectRequirements {
  description: string;
  quantity?: string;
  preferredRegion?: string;
  applicationType?: string;
  industry?: string;
  mechanicalRequirements?: string[];
  surfaceFinish?: string;
  partSize?: string;
  certificationsNeeded?: string[];
}

interface MatchResult {
  supplier: {
    supplier_id: string;
    name: string;
    website: string | null;
    description: string | null;
    technologies: string[] | null;
    materials: string[] | null;
    region: string | null;
    location_city: string | null;
    location_country: string | null;
    verified: boolean;
    premium: boolean;
    logo_url: string | null;
  };
  score: number;
  matchDetails: {
    technologyScore: number;
    materialScore: number;
    locationScore: number;
    certificationScore: number;
    overallExplanation: string;
    matchedTechnologies: string[];
    matchedMaterials: string[];
    matchedCertifications: string[];
  };
}

interface TechnologyRationale {
  recommendedTechnologies: string[];
  recommendedMaterials: string[];
  technologyExplanation: string;
  materialExplanation: string;
  whyTheseTechnologies: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const rawProject = body?.project;
    
    if (!rawProject || typeof rawProject.description !== 'string' || !rawProject.description.trim()) {
      return new Response(
        JSON.stringify({ error: 'Project description is required (max 2000 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize and limit all string inputs
    const project: ProjectRequirements = {
      description: rawProject.description.trim().slice(0, 2000),
      quantity: typeof rawProject.quantity === 'string' ? rawProject.quantity.trim().slice(0, 100) : undefined,
      preferredRegion: typeof rawProject.preferredRegion === 'string' ? rawProject.preferredRegion.trim().slice(0, 100) : undefined,
      industry: typeof rawProject.industry === 'string' ? rawProject.industry.trim().slice(0, 100) : undefined,
      applicationType: typeof rawProject.applicationType === 'string' ? rawProject.applicationType.trim().slice(0, 100) : undefined,
      mechanicalRequirements: typeof rawProject.mechanicalRequirements === 'string' ? rawProject.mechanicalRequirements.trim().slice(0, 200) : undefined,
      surfaceFinish: typeof rawProject.surfaceFinish === 'string' ? rawProject.surfaceFinish.trim().slice(0, 100) : undefined,
      partSize: typeof rawProject.partSize === 'string' ? rawProject.partSize.trim().slice(0, 100) : undefined,
      certificationsNeeded: Array.isArray(rawProject.certificationsNeeded) ? rawProject.certificationsNeeded.filter((c: unknown) => typeof c === 'string').map((c: string) => c.trim().slice(0, 50)).slice(0, 20) : undefined,
    };

    console.log('Matching project:', project.description.substring(0, 100));
    console.log('Structured inputs:', {
      industry: project.industry,
      application: project.applicationType,
      mechanical: project.mechanicalRequirements,
      surface: project.surfaceFinish,
      size: project.partSize,
      certifications: project.certificationsNeeded,
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get all suppliers from database
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('supplier_id, name, website, description, technologies, materials, region, location_city, location_country, verified, premium, logo_url');

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch suppliers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${suppliers?.length || 0} suppliers to match against`);

    // Build recommended technologies/materials based on structured inputs
    const recommendedTechs: string[] = [];
    const recommendedCerts: string[] = [];
    
    if (project.industry && INDUSTRY_TO_TECHNOLOGIES[project.industry]) {
      recommendedTechs.push(...INDUSTRY_TO_TECHNOLOGIES[project.industry]);
    }
    if (project.industry && INDUSTRY_TO_CERTIFICATIONS[project.industry]) {
      recommendedCerts.push(...INDUSTRY_TO_CERTIFICATIONS[project.industry]);
    }
    if (project.applicationType && APPLICATION_TO_TECHNOLOGIES[project.applicationType]) {
      recommendedTechs.push(...APPLICATION_TO_TECHNOLOGIES[project.applicationType]);
    }
    if (project.mechanicalRequirements) {
      for (const req of project.mechanicalRequirements) {
        if (MECHANICAL_TO_TECHNOLOGIES[req]) {
          recommendedTechs.push(...MECHANICAL_TO_TECHNOLOGIES[req]);
        }
      }
    }
    if (project.surfaceFinish && SURFACE_TO_TECHNOLOGIES[project.surfaceFinish]) {
      recommendedTechs.push(...SURFACE_TO_TECHNOLOGIES[project.surfaceFinish]);
    }
    if (project.partSize && SIZE_TO_TECHNOLOGIES[project.partSize]) {
      recommendedTechs.push(...SIZE_TO_TECHNOLOGIES[project.partSize]);
    }
    if (project.certificationsNeeded) {
      recommendedCerts.push(...project.certificationsNeeded.filter(c => c !== 'none'));
    }

    // Deduplicate
    const uniqueRecommendedTechs = [...new Set(recommendedTechs)];
    const uniqueRecommendedCerts = [...new Set(recommendedCerts)];

    console.log('Recommended technologies from structured input:', uniqueRecommendedTechs);
    console.log('Recommended certifications:', uniqueRecommendedCerts);

    // Call AI to analyze project requirements (enhanced with structured data)
    const analysisPrompt = `Analyze this 3D printing project and extract specific requirements.

PROJECT DESCRIPTION:
${project.description}

STRUCTURED USER INPUTS (use these to guide your analysis):
${project.industry ? `INDUSTRY: ${project.industry}` : ''}
${project.applicationType ? `APPLICATION TYPE: ${project.applicationType}` : ''}
${project.mechanicalRequirements?.length ? `MECHANICAL REQUIREMENTS: ${project.mechanicalRequirements.join(', ')}` : ''}
${project.surfaceFinish ? `SURFACE FINISH: ${project.surfaceFinish}` : ''}
${project.partSize ? `PART SIZE: ${project.partSize}` : ''}
${project.certificationsNeeded?.length ? `REQUIRED CERTIFICATIONS: ${project.certificationsNeeded.join(', ')}` : ''}
${project.quantity ? `QUANTITY: ${project.quantity}` : ''}
${project.preferredRegion ? `PREFERRED REGION: ${project.preferredRegion}` : ''}

RECOMMENDED TECHNOLOGIES (based on user inputs): ${uniqueRecommendedTechs.join(', ') || 'Not specified'}

AVAILABLE TECHNOLOGIES: FDM/FFF, SLA, SLS, Multi Jet Fusion, DMLS, SLM, Material Jetting, Binder Jetting, DLP, SAF, Direct Metal Printing, PolyJet
AVAILABLE MATERIALS: PLA, ABS, PETG, Nylon PA-12, PA-11, TPU, Polycarbonate, Carbon Fiber Reinforced, Titanium Ti-6Al-4V, Aluminum AlSi10Mg, Stainless Steel 316L, Inconel 718, Clear Resin, Tough Resin, PEEK, ULTEM
AVAILABLE REGIONS: Scandinavia, Western Europe, Central Europe, UK & Ireland, North America, Asia Pacific, Global

Extract the requirements. Prioritize the recommended technologies if they match the project needs.`;

    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert 3D printing consultant. Analyze project requirements and extract structured data. Use the structured user inputs to inform your technology and material recommendations.' },
          { role: 'user', content: analysisPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_requirements',
              description: 'Extract structured project requirements for supplier matching',
              parameters: {
                type: 'object',
                properties: {
                  requiredTechnologies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Required 3D printing technologies based on project needs and structured inputs'
                  },
                  requiredMaterials: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Required materials based on mechanical, thermal, and chemical requirements'
                  },
                  preferredRegions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Preferred geographic regions'
                  },
                  requiredCertifications: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Required certifications based on industry (e.g. ISO 13485, AS9100, IATF 16949, FDA)'
                  },
                  isProductionRun: {
                    type: 'boolean',
                    description: 'Whether this is a production run (100+ units) vs prototype'
                  },
                  requiresMetal: {
                    type: 'boolean',
                    description: 'Whether metal 3D printing is required'
                  },
                  requiresHighPrecision: {
                    type: 'boolean',
                    description: 'Whether high precision/detail is required'
                  },
                  requiresFlexibility: {
                    type: 'boolean',
                    description: 'Whether flexible materials are needed'
                  },
                  industry: {
                    type: 'string',
                    description: 'The industry sector (automotive, aerospace, medical, food, etc.)'
                  },
                  mechanicalNeeds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Mechanical requirements (high-strength, heat-resistant, chemical-resistant, etc.)'
                  },
                  surfaceRequirement: {
                    type: 'string',
                    description: 'Surface finish requirement (standard, smooth, cosmetic, sterilizable)'
                  },
                  projectSummary: {
                    type: 'string',
                    description: 'Brief summary of the project in 1-2 sentences'
                  }
                },
                required: ['requiredTechnologies', 'requiredMaterials', 'preferredRegions', 'projectSummary'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_requirements' } }
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('AI analysis error:', analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = await analysisResponse.json();
    const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ error: 'Failed to analyze project' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requirements = JSON.parse(toolCall.function.arguments);
    
    // Merge AI-extracted certifications with user-specified ones
    if (uniqueRecommendedCerts.length > 0) {
      requirements.requiredCertifications = [
        ...new Set([
          ...(requirements.requiredCertifications || []),
          ...uniqueRecommendedCerts
        ])
      ];
    }
    
    console.log('Extracted requirements:', requirements);

    // Score each supplier
    const matches: MatchResult[] = [];

    for (const supplier of suppliers || []) {
      const supplierTechs = supplier.technologies || [];
      const supplierMaterials = supplier.materials || [];
      const supplierRegion = supplier.region || '';
      const supplierDescription = (supplier.description || '').toLowerCase();

      // Technology match score
      let techScore = 0;
      const matchedTechs: string[] = [];
      if (requirements.requiredTechnologies && requirements.requiredTechnologies.length > 0) {
        for (const reqTech of requirements.requiredTechnologies) {
          const match = supplierTechs.find((t: string) => fuzzyMatch(t, reqTech));
          if (match) {
            matchedTechs.push(match);
            techScore += 1 / requirements.requiredTechnologies.length;
          }
        }
      } else {
        techScore = 0; // No requirement = no score
      }

      // Material match score
      let materialScore = 0;
      const matchedMats: string[] = [];
      if (requirements.requiredMaterials && requirements.requiredMaterials.length > 0) {
        for (const reqMat of requirements.requiredMaterials) {
          const match = supplierMaterials.find((m: string) => fuzzyMatch(m, reqMat));
          if (match) {
            matchedMats.push(match);
            materialScore += 1 / requirements.requiredMaterials.length;
          }
        }
      } else {
        materialScore = 0; // No requirement = no score
      }

      // Location match score
      let locationScore = 0;
      if (requirements.preferredRegions && requirements.preferredRegions.length > 0) {
        for (const region of requirements.preferredRegions) {
          if (fuzzyMatch(supplierRegion, region)) {
            locationScore = 1;
            break;
          } else if (supplierRegion === 'Global') {
            locationScore = 0.5; // Global = partial match, not perfect
          }
        }
      } else {
        locationScore = 0.3; // Slight benefit when no region preference
      }

      // Certification match score (enhanced)
      let certificationScore = 0;
      const matchedCerts: string[] = [];
      
      if (requirements.requiredCertifications && requirements.requiredCertifications.length > 0) {
        // Check supplier description for certification mentions
        for (const cert of requirements.requiredCertifications) {
          const certLower = cert.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (supplierDescription.includes(certLower) || 
              supplierDescription.includes(cert.toLowerCase()) ||
              supplierDescription.includes('iso 13485') && certLower.includes('13485') ||
              supplierDescription.includes('as9100') && certLower.includes('as9100') ||
              supplierDescription.includes('iatf') && certLower.includes('16949')) {
            matchedCerts.push(cert);
            certificationScore += 1 / requirements.requiredCertifications.length;
          }
        }
      } else {
        // Bonus for verified/premium suppliers when no specific certs required
        certificationScore = (supplier.verified ? 0.5 : 0) + (supplier.premium ? 0.5 : 0);
      }

      // Capacity score based on whether it's production or prototype
      let capacityScore = 0.3;
      if (requirements.isProductionRun) {
        // Production-oriented technologies get higher score
        const productionTechs = ['Multi Jet Fusion', 'SLS', 'SAF'];
        if (supplierTechs.some((t: string) => productionTechs.some(pt => t.includes(pt)))) {
          capacityScore = 1;
        }
      }

      // Calculate weighted total score
      const totalScore = 
        (techScore * WEIGHTS.technology) +
        (materialScore * WEIGHTS.material) +
        (locationScore * WEIGHTS.location) +
        (certificationScore * WEIGHTS.certification) +
        (capacityScore * WEIGHTS.capacity);

      // Only include suppliers with meaningful matches (must match both tech AND material)
      if (totalScore > 0.35 && matchedTechs.length > 0 && matchedMats.length > 0) {
        matches.push({
          supplier: {
            supplier_id: supplier.supplier_id,
            name: supplier.name,
            website: supplier.website,
            description: supplier.description,
            technologies: supplier.technologies,
            materials: supplier.materials,
            region: supplier.region,
            location_city: supplier.location_city,
            location_country: supplier.location_country,
            verified: supplier.verified || false,
            premium: supplier.premium || false,
            logo_url: supplier.logo_url,
          },
          score: Math.round(totalScore * 100),
          matchDetails: {
            technologyScore: Math.round(techScore * 100),
            materialScore: Math.round(materialScore * 100),
            locationScore: Math.round(locationScore * 100),
            certificationScore: Math.round(certificationScore * 100),
            overallExplanation: '',
            matchedTechnologies: matchedTechs,
            matchedMaterials: matchedMats,
            matchedCertifications: matchedCerts,
          },
        });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Get top matches
    const topMatches = matches.slice(0, 8);

    // Generate explanations for top matches using AI
    if (topMatches.length > 0) {
      const explanationPrompt = `Based on this project:
"${requirements.projectSummary}"

Industry: ${requirements.industry || 'Not specified'}
Mechanical needs: ${requirements.mechanicalNeeds?.join(', ') || 'Not specified'}

Generate brief, friendly explanations (1-2 sentences each in English) for why each supplier is a good match:

${topMatches.map((m, i) => `${i + 1}. ${m.supplier.name} - Score: ${m.score}%, Matched: ${m.matchDetails.matchedTechnologies.join(', ')}, ${m.matchDetails.matchedMaterials.join(', ')}${m.matchDetails.matchedCertifications.length ? `, Certs: ${m.matchDetails.matchedCertifications.join(', ')}` : ''}`).join('\n')}`;

      try {
        const explanationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a helpful assistant. Write in English. Be concise and friendly.' },
              { role: 'user', content: explanationPrompt }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'provide_explanations',
                  description: 'Provide match explanations for suppliers',
                  parameters: {
                    type: 'object',
                    properties: {
                      explanations: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of explanation strings, one per supplier in order'
                      }
                    },
                    required: ['explanations'],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'provide_explanations' } }
          }),
        });

        if (explanationResponse.ok) {
          const expData = await explanationResponse.json();
          const expToolCall = expData.choices?.[0]?.message?.tool_calls?.[0];
          if (expToolCall) {
            const expResult = JSON.parse(expToolCall.function.arguments);
            expResult.explanations?.forEach((exp: string, i: number) => {
              if (topMatches[i]) {
                topMatches[i].matchDetails.overallExplanation = exp;
              }
            });
          }
        }
      } catch (e) {
        console.error('Error generating explanations:', e);
        // Continue without explanations
      }
    }

    console.log(`Returning ${topMatches.length} matches`);

    // Log match analytics
    const durationMs = Date.now() - startTime;
    const avgScore = topMatches.length > 0 
      ? topMatches.reduce((sum, m) => sum + m.score, 0) / topMatches.length 
      : 0;

    try {
      await supabase.from('ai_match_analytics').insert({
        project_description: project.description.substring(0, 500),
        extracted_requirements: requirements,
        matched_suppliers: topMatches.map(m => ({
          supplier_id: m.supplier.supplier_id,
          supplier_name: m.supplier.name,
          score: m.score
        })),
        match_score_avg: avgScore,
        match_duration_ms: durationMs
      });
      console.log('Match analytics logged');
    } catch (e) {
      console.error('Failed to log match analytics:', e);
    }

    // Generate technology rationale explaining WHY these technologies are recommended
    let technologyRationale: TechnologyRationale | null = null;
    
    try {
      const rationalePrompt = `Based on this 3D printing project, explain WHY specific technologies and materials are recommended.

PROJECT: "${requirements.projectSummary}"
INDUSTRY: ${requirements.industry || 'Not specified'}
MECHANICAL NEEDS: ${requirements.mechanicalNeeds?.join(', ') || 'Not specified'}
SURFACE REQUIREMENT: ${requirements.surfaceRequirement || 'Not specified'}

RECOMMENDED TECHNOLOGIES: ${requirements.requiredTechnologies?.join(', ') || 'Not specified'}
RECOMMENDED MATERIALS: ${requirements.requiredMaterials?.join(', ') || 'Not specified'}

Write in Danish. Be educational and friendly. Explain for someone who may not know about 3D printing.`;

      const rationaleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert 3D printing consultant who explains complex technology choices in simple terms. Write in Danish.' },
            { role: 'user', content: rationalePrompt }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'provide_rationale',
                description: 'Provide technology and material rationale',
                parameters: {
                  type: 'object',
                  properties: {
                    recommendedTechnologies: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Top 2-3 recommended technologies'
                    },
                    recommendedMaterials: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Top 2-3 recommended materials'
                    },
                    technologyExplanation: {
                      type: 'string',
                      description: 'Short explanation (1-2 sentences) of why these technologies are best for this project. In Danish.'
                    },
                    materialExplanation: {
                      type: 'string',
                      description: 'Short explanation (1-2 sentences) of why these materials are best. In Danish.'
                    },
                    whyTheseTechnologies: {
                      type: 'string',
                      description: 'A friendly 2-3 sentence explanation aimed at non-experts explaining WHY we recommend these technologies for their specific needs. In Danish.'
                    }
                  },
                  required: ['recommendedTechnologies', 'recommendedMaterials', 'technologyExplanation', 'materialExplanation', 'whyTheseTechnologies'],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'provide_rationale' } }
        }),
      });

      if (rationaleResponse.ok) {
        const rationaleData = await rationaleResponse.json();
        const rationaleToolCall = rationaleData.choices?.[0]?.message?.tool_calls?.[0];
        if (rationaleToolCall) {
          technologyRationale = JSON.parse(rationaleToolCall.function.arguments);
          console.log('Generated technology rationale:', technologyRationale);
        }
      }
    } catch (e) {
      console.error('Error generating technology rationale:', e);
      // Continue without rationale
    }

    console.log(`Returning ${topMatches.length} matches`);

    // Log match analytics
    const durationMs = Date.now() - startTime;
    const avgScore = topMatches.length > 0 
      ? topMatches.reduce((sum, m) => sum + m.score, 0) / topMatches.length 
      : 0;

    try {
      await supabase.from('ai_match_analytics').insert({
        project_description: project.description.substring(0, 500),
        extracted_requirements: requirements,
        matched_suppliers: topMatches.map(m => ({
          supplier_id: m.supplier.supplier_id,
          supplier_name: m.supplier.name,
          score: m.score
        })),
        match_score_avg: avgScore,
        match_duration_ms: durationMs
      });
      console.log('Match analytics logged');
    } catch (e) {
      console.error('Failed to log match analytics:', e);
    }

    return new Response(
      JSON.stringify({
        requirements,
        matches: topMatches,
        totalSuppliersAnalyzed: suppliers?.length || 0,
        technologyRationale,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Matching error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
