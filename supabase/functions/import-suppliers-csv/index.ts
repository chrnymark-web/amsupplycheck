import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

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

// Helper function to map IDs to human-readable names
const mapTechnologies = (ids: string[]): string[] => {
  return ids
    .map(id => technologyMap[id.toLowerCase()] || technologyMap[id] || id)
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
};

const mapMaterials = (ids: string[]): string[] => {
  return ids
    .map(id => materialMap[id.toLowerCase()] || materialMap[id] || id)
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
};

// Input validation schema
const ImportRequestSchema = z.object({
  csvContent: z.string().max(10 * 1024 * 1024) // 10MB max
});

interface SupplierCsvRow {
  Id: string;
  Title: string;
  PublicData: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting CSV import process...');
    
    // Admin authorization check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin access required', code: 'INSUFFICIENT_PERMISSIONS' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawData = await req.json();
    const validationResult = ImportRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input: CSV too large or malformed', 
          code: 'VALIDATION_ERROR'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { csvContent } = validationResult.data;
    
    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    if (!csvContent) {
      console.error('No CSV content provided in request body');
      return new Response(
        JSON.stringify({ error: 'CSV content is required in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('CSV content received, length:', csvContent.length);

    // Parse CSV with proper handling of quoted fields
    const lines = csvContent.split('\n');
    const headerLine = lines[0];
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Simple CSV parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const headers = parseCSVLine(headerLine);

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim();
        });

        // Parse PublicData JSON
        let publicData: any = {};
        try {
          publicData = JSON.parse(row.PublicData || '{}');
        } catch (e) {
          console.error(`Failed to parse PublicData for row ${i}:`, e);
          errors++;
          continue;
        }

        // Extract location data
        const location = publicData.location || {};
        const address = location.address || '';
        
        // Extract country from address
        const countryMatch = address.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s*$/);
        const country = countryMatch ? countryMatch[1] : '';
        
        // Extract city (second to last part before country)
        const cityMatch = address.split(',').slice(-2, -1)[0]?.trim();
        const city = cityMatch || '';

        // Prepare supplier data with mapped technologies and materials
        const rawTechnologies = publicData.TechnologyID || [];
        const rawMaterials = [
          ...(publicData.thermoplasticid || []),
          ...(publicData.metalid || []),
          ...(publicData.photopolymerid || [])
        ];

        const supplierData = {
          supplier_id: row.Id,
          name: row.Title,
          website: publicData.affiliatelinkid,
          location_address: address,
          location_city: city,
          location_country: country,
          technologies: mapTechnologies(rawTechnologies),
          materials: mapMaterials(rawMaterials),
          card_style: publicData.cardStyle,
          listing_type: publicData.listingType,
          region: publicData.categoryLevel1,
          metadata: publicData
        };

        // Insert or update supplier
        const { error } = await supabase
          .from('suppliers')
          .upsert(supplierData, { onConflict: 'supplier_id' });

        if (error) {
          console.error(`Error importing supplier ${row.Title}:`, error);
          errors++;
        } else {
          imported++;
        }
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        errors++;
      }
    }

    console.log(`Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported, 
        skipped, 
        errors,
        message: `Successfully imported ${imported} suppliers` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error server-side only
    console.error('Import error:', {
      timestamp: new Date().toISOString(),
      errorType: error?.constructor?.name
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Import failed',
        code: 'IMPORT_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
