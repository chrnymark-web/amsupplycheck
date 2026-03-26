import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema - max 10MB, validates structure
const ImportRequestSchema = z.object({
  csvContent: z.string()
    .min(1, 'CSV content is required')
    .max(10 * 1024 * 1024, 'CSV content exceeds 10MB limit')
});

const MAX_ROWS = 10000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Addidex supplier import...');

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

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input with Zod
    const validationResult = ImportRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', code: 'VALIDATION_ERROR' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { csvContent } = validationResult.data;

    // Parse CSV
    const lines = csvContent.trim().split('\n');
    
    // Validate row count
    if (lines.length > MAX_ROWS + 1) { // +1 for header
      return new Response(
        JSON.stringify({ error: `CSV exceeds maximum ${MAX_ROWS} rows`, code: 'ROW_LIMIT_EXCEEDED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = lines[0].split(',').map((h: string) => h.trim());
    
    console.log('CSV headers:', headers);
    console.log(`Processing ${lines.length - 1} rows`);

    const suppliers = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v: string) => v.trim());
      const brand = values[0];
      const website = values[1];

      if (!brand || !website) {
        console.log(`Skipping line ${i}: missing brand or website`);
        skipped++;
        continue;
      }

      // Basic URL validation
      if (website && !website.match(/^https?:\/\/.+/i) && !website.match(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+/i)) {
        console.log(`Skipping line ${i}: invalid website format`);
        skipped++;
        continue;
      }

      // Generate supplier_id from brand name
      const supplierId = brand
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if supplier already exists
      const { data: existing } = await supabase
        .from('suppliers')
        .select('supplier_id')
        .eq('supplier_id', supplierId)
        .single();

      if (existing) {
        console.log(`Supplier ${brand} already exists, skipping`);
        skipped++;
        continue;
      }

      suppliers.push({
        supplier_id: supplierId,
        name: brand,
        website: website.startsWith('http') ? website : `https://${website}`,
        // Set last_validated_at to NOW to put them at the back of the validation queue
        last_validated_at: new Date().toISOString(),
        // Default coordinates that will trigger re-validation eventually
        location_lat: 13.4,
        location_lng: 52.52,
        technologies: [],
        materials: [],
        verified: false,
        premium: false,
        rating: 0,
        review_count: 0,
        metadata: {}
      });
    }

    // Bulk insert suppliers
    if (suppliers.length > 0) {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(suppliers)
        .select();

      if (error) {
        console.error('Error inserting suppliers:', error);
        throw error;
      }

      imported = data?.length || 0;
      console.log(`Successfully imported ${imported} suppliers`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imported,
        skipped,
        message: `Imported ${imported} new suppliers, skipped ${skipped} existing/invalid`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Import operation failed',
        code: 'IMPORT_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
