import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Log search analytics
async function logSearchAnalytics(
  query: string, technologies: string[], materials: string[], areas: string[],
  certifications: string[], productionVolume: string, resultsCount: number,
  searchType: string, durationMs: number, sessionId?: string
) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('search_analytics').insert({
      query, extracted_technologies: technologies, extracted_materials: materials,
      extracted_regions: areas, extracted_certifications: certifications,
      production_volume: productionVolume, results_count: resultsCount,
      search_type: searchType, search_duration_ms: durationMs, session_id: sessionId
    });
  } catch (e) {
    console.error('Failed to log analytics:', e);
  }
}

// Available technologies in our database
const TECHNOLOGIES = [
  'FDM/FFF', 'SLA', 'SLS', 'MJF', 'DMLS', 'SLM', 'DLP', 'EBM',
  'Material Jetting', 'Binder Jetting', 'SAF', 'Direct Metal Printing',
  'PolyJet', 'Carbon DLS', 'CNC Machining', 'CNC Milling', 'CNC Turning',
  'Injection Molding', 'Vacuum Casting', 'Sheet Metal', 'Laser Cutting',
  'Investment Casting', 'Sand Casting', 'Die Casting'
];

// Available materials in our database
const MATERIALS = [
  'PLA', 'ABS', 'PETG', 'Nylon', 'PA-12', 'PA-11', 'TPU', 'PEEK', 'PEI/Ultem',
  'Polycarbonate', 'Polypropylene', 'ASA', 'HIPS',
  'PA-12 Glass Filled', 'PA-12 Carbon Filled', 'Carbon Fiber Reinforced', 'Kevlar',
  'Standard Resin', 'Tough Resin', 'Flexible Resin', 'Clear Resin', 'High Temp Resin',
  'Castable Resin', 'Dental Resin', 'Biocompatible Resin',
  'Titanium', 'Titanium Ti-6Al-4V', 'Aluminum', 'Aluminum AlSi10Mg',
  'Stainless Steel', 'Stainless Steel 316L', 'Stainless Steel 17-4PH',
  'Inconel 718', 'Inconel 625', 'Cobalt Chrome', 'Maraging Steel',
  'Copper', 'Brass', 'Bronze', 'Tool Steel',
  'Silicone', 'Ceramic', 'Concrete'
];

// Available regions
const REGIONS = [
  'Western Europe', 'Central Europe', 'Scandinavia', 'UK & Ireland',
  'Eastern Europe', 'North America', 'Asia Pacific', 'Middle East',
  'South America', 'Africa', 'Global'
];

// Available certifications
const CERTIFICATIONS = [
  'ISO 9001', 'ISO 13485', 'ISO 14001', 'AS9100', 'NADCAP',
  'IATF 16949', 'FDA Registered', 'CE Marking'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { query, sessionId } = await req.json();

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      console.error('ANTHROPIC_API_KEY not set, falling back to keyword search');
      return new Response(JSON.stringify({
        error: 'Smart search not configured',
        fallback: true,
        technologies: [], materials: [], areas: [], certifications: [],
        keywords: query, explanation: 'Keyword search', confidence: 0,
        originalQuery: query
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Call Claude Haiku for fast, cheap query parsing
    const systemPrompt = `You are a search query parser for AMSupplyCheck, a 3D printing supplier directory.
Extract structured filters from the user's search query. The user may write in any language (Danish, English, German, etc.).

AVAILABLE TECHNOLOGIES (use exact names):
${TECHNOLOGIES.join(', ')}

AVAILABLE MATERIALS (use exact names):
${MATERIALS.join(', ')}

AVAILABLE REGIONS:
${REGIONS.join(', ')}

AVAILABLE CERTIFICATIONS:
${CERTIFICATIONS.join(', ')}

RULES:
- Map country names to regions: Denmark/Sweden/Norway/Finland → "Scandinavia", Germany/Austria/Switzerland → "Central Europe", France/Netherlands/Belgium/Spain/Italy → "Western Europe", UK/England → "UK & Ireland", USA/Canada → "North America", China/Japan/India/Australia → "Asia Pacific"
- If the user mentions "Europe" generally, include: Western Europe, Central Europe, Scandinavia, UK & Ireland
- For material queries like "metal" or "titanium", include relevant specific materials
- For technology queries like "3d printing" or "laser", include relevant specific technologies
- "prototype" → productionVolume: "prototype", "urgent/rush/fast" → urgency: "rush"
- Only include certifications if explicitly mentioned or strongly implied (e.g. "aerospace" implies AS9100, NADCAP)
- If the query is just a company name (e.g. "Protolabs", "Materialise"), set keywords to the name and leave filters minimal
- The "keywords" field should contain remaining search terms not captured by other filters (e.g. company names, industry terms)
- Be generous with technology/material matching - if unsure, include rather than exclude
- confidence: 0-100 how confident you are in the parsing

Respond with ONLY valid JSON, no markdown:
{"technologies":[],"materials":[],"areas":[],"certifications":[],"productionVolume":"","urgency":"standard","keywords":"","explanation":"","confidence":0}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Parse this search query: "${query}"` }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      // Fall back to keyword search
      return new Response(JSON.stringify({
        error: 'Service temporarily unavailable',
        fallback: true,
        technologies: [], materials: [], areas: [], certifications: [],
        keywords: query, explanation: 'Keyword search (smart search unavailable)',
        confidence: 0, originalQuery: query
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const claudeResponse = await response.json();
    const content = claudeResponse.content?.[0]?.text || '{}';

    // Parse Claude's JSON response
    let parsed;
    try {
      // Handle potential markdown wrapping
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse Claude response:', content);
      parsed = {
        technologies: [], materials: [], areas: [], certifications: [],
        keywords: query, explanation: 'Parse error', confidence: 0
      };
    }

    const result = {
      technologies: parsed.technologies || [],
      materials: parsed.materials || [],
      areas: parsed.areas || [],
      certifications: parsed.certifications || [],
      productionVolume: parsed.productionVolume || '',
      urgency: parsed.urgency || 'standard',
      keywords: parsed.keywords || '',
      explanation: parsed.explanation || '',
      confidence: parsed.confidence || 0,
      originalQuery: query
    };

    const durationMs = Date.now() - startTime;
    console.log(`Claude search parsed in ${durationMs}ms:`, JSON.stringify(result));

    // Log analytics (non-blocking)
    logSearchAnalytics(
      query, result.technologies, result.materials, result.areas,
      result.certifications, result.productionVolume, 0,
      'claude-haiku', durationMs, sessionId
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Search error:', err);
    return new Response(JSON.stringify({
      error: err.message || 'Internal error',
      fallback: true,
      technologies: [], materials: [], areas: [], certifications: [],
      keywords: '', explanation: 'Error occurred', confidence: 0, originalQuery: ''
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
