import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base prices per cm3 by technology (USD)
const BASE_PRICES: Record<string, { low: number; high: number }> = {
  'FDM/FFF':           { low: 0.04, high: 0.15 },
  'SLS':               { low: 0.12, high: 0.40 },
  'SLA':               { low: 0.08, high: 0.30 },
  'MJF':               { low: 0.10, high: 0.30 },
  'DMLS':              { low: 1.00, high: 4.00 },
  'SLM':               { low: 1.00, high: 4.00 },
  'DLP':               { low: 0.08, high: 0.30 },
  'Material Jetting':  { low: 0.15, high: 0.50 },
  'Binder Jetting':    { low: 0.20, high: 0.80 },
};

// Material cost multipliers relative to cheapest in category
const MATERIAL_MULTIPLIERS: Record<string, number> = {
  'PLA': 1.0, 'ABS': 1.1, 'PETG': 1.15, 'ASA': 1.2,
  'Nylon': 1.4, 'TPU': 1.3, 'Polycarbonate': 1.6,
  'PEEK': 5.0, 'PEI/Ultem': 4.0,
  'PA-12': 1.0, 'PA-11': 1.1,
  'PA-12 Glass Filled': 1.3, 'PA-12 Carbon Filled': 1.8,
  'Polypropylene': 1.1,
  'Standard Resin': 1.0, 'Tough Resin': 1.2, 'Flexible Resin': 1.3,
  'Clear Resin': 1.2, 'High Temp Resin': 1.5,
  'Castable Resin': 1.4, 'Dental Resin': 2.0, 'Biocompatible Resin': 2.5,
  'Titanium': 1.8, 'Titanium Ti-6Al-4V': 2.0,
  'Aluminum AlSi10Mg': 1.0, 'Aluminum': 1.0,
  'Stainless Steel 316L': 1.0, 'Stainless Steel': 1.0,
  'Stainless Steel 17-4PH': 1.2,
  'Inconel 718': 2.5, 'Inconel 625': 2.3,
  'Cobalt Chrome': 2.0, 'Maraging Steel': 1.5,
  'Ceramic': 1.5, 'Copper': 2.0, 'Bronze': 1.5,
};

// Technology slug mapping for database queries
const TECH_SLUG_MAP: Record<string, string[]> = {
  'FDM/FFF': ['fdm', 'fff'],
  'SLS': ['sls'],
  'SLA': ['sla'],
  'MJF': ['mjf'],
  'DMLS': ['dmls'],
  'SLM': ['slm'],
  'DLP': ['dlp'],
  'Material Jetting': ['material-jetting', 'polyjet'],
  'Binder Jetting': ['binder-jetting'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { volumeCm3, surfaceAreaCm2, boundingBox, triangleCount, technology, material, quantity } = await req.json();

    if (!volumeCm3 || !technology || !material) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate price estimate
    const basePrice = BASE_PRICES[technology] || { low: 0.10, high: 0.50 };
    const materialMult = MATERIAL_MULTIPLIERS[material] || 1.0;

    // Volume-based pricing
    let lowPerPart = volumeCm3 * basePrice.low * materialMult;
    let highPerPart = volumeCm3 * basePrice.high * materialMult;

    // Minimum price floor
    const minPrice = technology.includes('DM') || technology === 'SLM' ? 25 : 3;
    lowPerPart = Math.max(lowPerPart, minPrice);
    highPerPart = Math.max(highPerPart, minPrice * 1.5);

    // Quantity discount
    let qtyDiscount = 1.0;
    if (quantity >= 100) qtyDiscount = 0.6;
    else if (quantity >= 50) qtyDiscount = 0.7;
    else if (quantity >= 20) qtyDiscount = 0.8;
    else if (quantity >= 10) qtyDiscount = 0.85;
    else if (quantity >= 5) qtyDiscount = 0.9;

    lowPerPart *= qtyDiscount;
    highPerPart *= qtyDiscount;

    // Complexity surcharge for high triangle counts
    const complexityFactor = triangleCount > 500000 ? 1.15 : triangleCount > 100000 ? 1.05 : 1.0;
    lowPerPart *= complexityFactor;
    highPerPart *= complexityFactor;

    // Size surcharge for large parts
    const maxDim = Math.max(boundingBox?.x || 0, boundingBox?.y || 0, boundingBox?.z || 0);
    const sizeFactor = maxDim > 300 ? 1.3 : maxDim > 200 ? 1.15 : maxDim > 100 ? 1.05 : 1.0;
    lowPerPart *= sizeFactor;
    highPerPart *= sizeFactor;

    // Build factors list
    const factors = [
      { name: 'Volume', detail: `${volumeCm3.toFixed(1)} cm³` },
      { name: 'Material', detail: `${material} (${materialMult}x)` },
    ];
    if (qtyDiscount < 1.0) factors.push({ name: 'Qty discount', detail: `${Math.round((1 - qtyDiscount) * 100)}% off` });
    if (complexityFactor > 1.0) factors.push({ name: 'Complexity', detail: `${triangleCount.toLocaleString()} triangles` });
    if (sizeFactor > 1.0) factors.push({ name: 'Oversize', detail: `${maxDim.toFixed(0)}mm max` });

    // Find matching suppliers
    let matchingSuppliers: { id: string; name: string; website: string; region: string }[] = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const techSlugs = TECH_SLUG_MAP[technology] || [technology.toLowerCase().replace(/[^a-z0-9]/g, '-')];

      // Query suppliers that have any of the tech slugs in their technologies array
      const { data } = await supabase
        .from('suppliers')
        .select('id, name, website, region')
        .overlaps('technologies', techSlugs)
        .limit(6);

      if (data) {
        matchingSuppliers = data.map(s => ({
          id: s.id,
          name: s.name.split(' – ')[0].split(' - ')[0], // Shorten name
          website: s.website,
          region: s.region || 'global',
        }));
      }
    }

    const result = {
      lowEstimate: Math.round(lowPerPart * 100) / 100,
      highEstimate: Math.round(highPerPart * 100) / 100,
      currency: 'USD',
      factors,
      matchingSuppliers,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Price estimate error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
