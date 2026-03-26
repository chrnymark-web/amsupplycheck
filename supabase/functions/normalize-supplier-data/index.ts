import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Technology mapping to human-readable names
const technologyMap: Record<string, string> = {
  'fdm': 'FDM/FFF',
  'sla': 'SLA',
  'sls': 'SLS',
  'mjf': 'Multi Jet Fusion',
  'dmls': 'DMLS',
  'slm': 'SLM',
  'material-jetting': 'Material Jetting',
  'binder-jetting': 'Binder Jetting',
  'dlp': 'DLP',
  'saf': 'SAF',
  'dmp': 'Direct Metal Printing',
  'cdlp': 'CDLP (Continuous Digital Light Processing)'
};

// Material mapping to human-readable names
const materialMap: Record<string, string> = {
  'standardpla': 'PLA',
  'abs-m30-stratasys': 'ABS M30',
  'abs-white': 'ABS (White)',
  'abs-like-black': 'ABS-like (Black)',
  'absplus-stratasys': 'ABS+ (Stratasys)',
  'abs-m30i': 'ABS M30i',
  'petg': 'PETG',
  'pc': 'Polycarbonate',
  'pc-or-pc-abs': 'PC/PC-ABS',
  'pei-ultem-1010-stratasys': 'PEI ULTEM 1010',
  'pei-ultem-9085-stratasys': 'PEI ULTEM 9085',
  'hips': 'HIPS',
  'nylon-pa-12': 'Nylon PA-12',
  'nylon-12': 'Nylon 12',
  'pa-12': 'PA-12',
  'pa11-sls': 'PA-11 (SLS)',
  'pa-12-carbon-filled': 'PA-12 Carbon Filled',
  'nylon-12-mineral-filled-hst': 'Nylon 12 Mineral Filled',
  'nylon-12-glass-bead-filled-gf': 'Nylon 12 Glass Filled',
  'nylon-12-flame-retardant-fr': 'Nylon 12 Flame Retardant',
  'nylon-12-aluminum-filled-af': 'Nylon 12 Aluminum Filled',
  'pa-af': 'PA Aluminum Filled',
  'pa-gf': 'PA Glass Filled',
  'duraform-pa-nylon-12': 'DuraForm PA Nylon 12',
  'mjf_pa12': 'MJF PA12',
  'sls_pa12_pa2200': 'SLS PA12 PA2200',
  'pa-12-bluesint': 'PA-12 BlueSint',
  'nylon-pa-12-blue-metal': 'Nylon PA-12 Blue Metal',
  'saf_pa11_eco': 'SAF PA11 Eco',
  'tpu-70-a-white': 'TPU (Flexible)',
  'tpu-mjf': 'TPU MJF',
  'sls_flexible_tpu': 'SLS Flexible TPU',
  'ultrasint_tpu01_mjf': 'Ultrasint TPU01 MJF',
  'polypropylene-mjf': 'Polypropylene (MJF)',
  'polypropylene-p': 'Polypropylene-P',
  'pp-natural': 'Polypropylene Natural',
  'photopolymer-rigid': 'Photopolymer Rigid',
  'accura-25': 'Accura 25',
  'carbonfiberreinforcedfilaments': 'Carbon Fiber Reinforced',
  'kevlarreinforcedfilaments': 'Kevlar Reinforced',
  'woodfilledpla': 'Wood Filled PLA',
  'stainless-steel-316l': 'Stainless Steel 316L',
  'titanium-ti-6al-4v': 'Titanium Ti-6Al-4V',
  'aluminum-aisi10mg': 'Aluminum AlSi10Mg',
  'inconel-718': 'Inconel 718',
  'inconel-625': 'Inconel 625',
  'ni625': 'Nickel 625',
  'maraging-steel': 'Maraging Steel',
  'steel': 'Steel',
  'stainless-steel-17-4ph': 'Stainless Steel 17-4PH',
  'gold-plated-brass': 'Gold Plated Brass',
  'bronze': 'Bronze',
  '420i-420ss-brz': '420i 420SS Bronze',
  'formlabs-clear-resin': 'Clear Resin',
  'formlabs-tough-resin-2000': 'Tough Resin 2000',
  'formlabs-standard-resin': 'Standard Resin',
  'formlabs-high-temp-resin': 'High Temp Resin',
  'formlabs-durable-resin': 'Durable Resin',
  'formlabs-flexible-resin-80a': 'Flexible Resin 80A',
  'somos-waterclear-ultra-10122': 'Somos WaterClear Ultra',
  'ultem-9085': 'ULTEM 9085',
  'duraform-hst': 'DuraForm HST',
  'duraform-tpu': 'DuraForm TPU',
  'duraform-ex': 'DuraForm EX',
  'duraform-gf-glass-filled-nylon': 'DuraForm GF Glass Filled Nylon'
};

const mapTechnologies = (ids: string[]): string[] => {
  return ids
    .map(id => technologyMap[id.toLowerCase()] || technologyMap[id] || id)
    .filter((value, index, self) => self.indexOf(value) === index);
};

const mapMaterials = (ids: string[]): string[] => {
  return ids
    .map(id => materialMap[id.toLowerCase()] || materialMap[id] || id)
    .filter((value, index, self) => self.indexOf(value) === index);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting supplier data normalization...');

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string;
    try {
      const payload = JSON.parse(atob(parts[1]));
      userId = payload.sub;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all suppliers
    const { data: suppliers, error: fetchError } = await supabase
      .from('suppliers')
      .select('id, supplier_id, name, technologies, materials');

    if (fetchError) {
      console.error('Error fetching suppliers:', fetchError);
      throw fetchError;
    }

    console.log(`Processing ${suppliers?.length || 0} suppliers...`);

    let updated = 0;
    let skipped = 0;

    for (const supplier of suppliers || []) {
      const originalTechnologies = supplier.technologies || [];
      const originalMaterials = supplier.materials || [];

      const normalizedTechnologies = mapTechnologies(originalTechnologies);
      const normalizedMaterials = mapMaterials(originalMaterials);

      // Check if anything changed
      const technologiesChanged = JSON.stringify(originalTechnologies.sort()) !== JSON.stringify(normalizedTechnologies.sort());
      const materialsChanged = JSON.stringify(originalMaterials.sort()) !== JSON.stringify(normalizedMaterials.sort());

      if (technologiesChanged || materialsChanged) {
        console.log(`Updating ${supplier.name}:`, {
          tech: { old: originalTechnologies, new: normalizedTechnologies },
          mat: { old: originalMaterials.slice(0, 3), new: normalizedMaterials.slice(0, 3) }
        });

        const { error: updateError } = await supabase
          .from('suppliers')
          .update({
            technologies: normalizedTechnologies,
            materials: normalizedMaterials
          })
          .eq('id', supplier.id);

        if (updateError) {
          console.error(`Error updating ${supplier.name}:`, updateError);
        } else {
          updated++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`Normalization complete: ${updated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        skipped,
        message: `Normalized ${updated} suppliers, ${skipped} already correct`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Normalization error:', error);
    return new Response(
      JSON.stringify({
        error: 'Normalization failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
