import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeResponse {
  features: {
    center: [number, number];
    place_name: string;
    relevance: number;
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN not configured');
    }

    // Get admin client for updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch suppliers without valid coordinates
    const { data: suppliers, error: fetchError } = await supabaseAdmin
      .from('suppliers')
      .select('id, supplier_id, name, location_address, location_city, location_country, location_lat, location_lng')
      .or('location_lat.is.null,location_lng.is.null,and(location_lat.eq.52.52,location_lng.eq.13.40)');

    if (fetchError) {
      console.error('Error fetching suppliers:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${suppliers?.length || 0} suppliers to geocode`);

    const results = {
      total: suppliers?.length || 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as { supplier: string; reason: string }[],
    };

    if (!suppliers || suppliers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No suppliers need geocoding', results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each supplier
    for (const supplier of suppliers) {
      // Build search query
      const searchParts = [
        supplier.location_address,
        supplier.location_city,
        supplier.location_country,
      ].filter(Boolean);

      if (searchParts.length === 0) {
        console.log(`Skipping ${supplier.name}: No location data`);
        results.skipped++;
        results.errors.push({
          supplier: supplier.name,
          reason: 'No location data available',
        });
        continue;
      }

      const searchQuery = encodeURIComponent(searchParts.join(', '));
      
      try {
        // Call Mapbox Geocoding API
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchQuery}.json?access_token=${mapboxToken}&limit=1`;
        
        console.log(`Geocoding ${supplier.name}: ${searchParts.join(', ')}`);
        
        const geocodeResponse = await fetch(geocodeUrl);
        
        if (!geocodeResponse.ok) {
          throw new Error(`Mapbox API error: ${geocodeResponse.status}`);
        }

        const geocodeData: GeocodeResponse = await geocodeResponse.json();

        if (!geocodeData.features || geocodeData.features.length === 0) {
          console.log(`No results for ${supplier.name}`);
          results.failed++;
          results.errors.push({
            supplier: supplier.name,
            reason: 'No geocoding results found',
          });
          continue;
        }

        const [lng, lat] = geocodeData.features[0].center;
        const relevance = geocodeData.features[0].relevance;

        console.log(`Found coordinates for ${supplier.name}: ${lat}, ${lng} (relevance: ${relevance})`);

        // Update supplier with new coordinates
        const { error: updateError } = await supabaseAdmin
          .from('suppliers')
          .update({
            location_lat: lat,
            location_lng: lng,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supplier.id);

        if (updateError) {
          console.error(`Error updating ${supplier.name}:`, updateError);
          results.failed++;
          results.errors.push({
            supplier: supplier.name,
            reason: `Database update failed: ${updateError.message}`,
          });
        } else {
          results.successful++;
        }

        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error geocoding ${supplier.name}:`, error);
        results.failed++;
        results.errors.push({
          supplier: supplier.name,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Geocoding complete:', results);

    return new Response(
      JSON.stringify({
        message: 'Geocoding complete',
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in geocode-suppliers function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
