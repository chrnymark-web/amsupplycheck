import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple test function to validate specific suppliers without auth
// Used for testing logo detection improvements
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 TEST VALIDATION FUNCTION STARTED');
    
    const { supplierIds } = await req.json();
    
    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'supplierIds array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 3 suppliers max for testing
    const idsToTest = supplierIds.slice(0, 3);
    console.log(`🎯 Testing ${idsToTest.length} suppliers: ${idsToTest.join(', ')}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get supplier details
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('supplier_id, name, website, logo_url, technologies, materials, location_country')
      .in('supplier_id', idsToTest);

    if (error || !suppliers) {
      console.error('❌ Failed to fetch suppliers:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch suppliers', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${suppliers.length} suppliers to validate`);

    const results = [];

    for (const supplier of suppliers) {
      console.log(`\n🔍 Validating: ${supplier.name}`);
      console.log(`🌐 Website: ${supplier.website}`);

      try {
        // Call validate-supplier function with service role
        const validateResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate-supplier`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              supplierId: supplier.supplier_id,
              supplierName: supplier.name,
              supplierWebsite: supplier.website,
              currentTechnologies: supplier.technologies || [],
              currentMaterials: supplier.materials || [],
              currentLocation: supplier.location_country || ''
            }),
          }
        );

        const validateResult = await validateResponse.json();
        console.log(`✅ Validation result for ${supplier.name}:`, JSON.stringify(validateResult, null, 2).substring(0, 500));

        results.push({
          supplier_id: supplier.supplier_id,
          name: supplier.name,
          status: validateResponse.ok ? 'success' : 'error',
          result: validateResult
        });

      } catch (err) {
        console.error(`❌ Error validating ${supplier.name}:`, err);
        results.push({
          supplier_id: supplier.supplier_id,
          name: supplier.name,
          status: 'error',
          error: String(err)
        });
      }
    }

    // Get updated supplier data after validation
    const { data: updatedSuppliers } = await supabase
      .from('suppliers')
      .select('supplier_id, name, logo_url, last_validation_confidence, technologies, materials, location_country')
      .in('supplier_id', idsToTest);

    console.log('\n📊 Final results:', JSON.stringify(updatedSuppliers, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        tested: idsToTest.length,
        results,
        updated_suppliers: updatedSuppliers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Test validation error:', error);
    return new Response(
      JSON.stringify({ error: 'Test failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
