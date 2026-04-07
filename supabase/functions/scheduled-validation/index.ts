import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-validation-secret',
};

// Input validation schema
const ValidationTriggerSchema = z.object({
  validateAll: z.boolean().optional(),
  validateUnverified: z.boolean().optional(),
  batchSize: z.number().optional(),
  supplierIds: z.array(z.string()).optional() // New: validate specific suppliers by ID
});

interface ValidationConfig {
  enabled: boolean;
  auto_approve_missing_data: boolean;
  auto_approve_technology_updates: boolean;
  auto_approve_material_updates: boolean;
  auto_approve_location_updates: boolean;
}

Deno.serve(async (req) => {
  // Log IMMEDIATELY when function is invoked
  console.log('\n\n🎬 ========================================');
  console.log('🎬 FUNCTION INVOKED AT:', new Date().toISOString());
  console.log('🎬 ========================================\n');
  
  if (req.method === 'OPTIONS') {
    console.log('✋ OPTIONS request - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 ===== SCHEDULED VALIDATION STARTED =====');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📨 Request method:', req.method);
    console.log('📋 Request URL:', req.url);
    
    // Log ALL headers in detail
    const allHeaders = Object.fromEntries(req.headers.entries());
    console.log('📦 ALL REQUEST HEADERS:', JSON.stringify(allHeaders, null, 2));
    
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Check authentication - via internal cron, service role, or JWT
    console.log('\n🔐 ===== AUTHENTICATION CHECK =====');
    const authHeader = req.headers.get('Authorization');
    const userAgent = req.headers.get('user-agent') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('🔑 Auth Header present:', !!authHeader);
    console.log('🔑 User-Agent:', userAgent);
    
    let isAuthorized = false;

    console.log('\n🔓 Attempting authentication...');
    
    // Method 1: Internal Supabase cron calls (pg_net)
    if (userAgent.includes('pg_net')) {
      console.log('✅ AUTHENTICATED via internal cron (pg_net)!');
      isAuthorized = true;
    }
    // Method 2: Service role key in Authorization header
    else if (authHeader && authHeader.replace('Bearer ', '') === serviceRoleKey) {
      console.log('✅ AUTHENTICATED via service role key!');
      isAuthorized = true;
    }
    // Method 3: Manual trigger authentication via admin JWT
    else if (authHeader) {
      console.log('🔍 Trying JWT authentication...');
      const token = authHeader.replace('Bearer ', '');
      const parts = token.split('.');
      
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          const userId = payload.sub;
          
          if (userId) {
            // Check admin role
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .eq('role', 'admin');

            if (roles && roles.length > 0) {
              console.log('✅ AUTHENTICATED via JWT (admin user)!');
              isAuthorized = true;
            } else {
              console.log('❌ JWT valid but user is not admin');
            }
          } else {
            console.log('❌ No user ID found in JWT');
          }
        } catch (error) {
          console.log('❌ JWT parsing failed:', error);
        }
      } else {
        console.log('❌ Invalid JWT format (expected 3 parts)');
      }
    } else {
      console.log('⚠️ No auth header provided');
    }

    if (!isAuthorized) {
      console.log('\n❌❌❌ UNAUTHORIZED - No valid authentication found ❌❌❌');
      console.log('Rejection reason: No valid secret header OR admin JWT provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('\n✅✅✅ AUTHORIZATION SUCCESSFUL ✅✅✅\n');

    // Validate input
    console.log('📥 Reading request body...');
    const rawData = await req.json();
    console.log('📥 Raw request data:', JSON.stringify(rawData, null, 2));
    
    console.log('🔍 Validating input schema...');
    const validationResult = ValidationTriggerSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request data', 
          code: 'VALIDATION_ERROR'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { validateAll, validateUnverified, batchSize, supplierIds } = validationResult.data;
    
    console.log('\n⚙️ ===== VALIDATION PARAMETERS =====');
    console.log(`📊 Validate all mode: ${validateAll || false}`);
    console.log(`📊 Validate unverified mode: ${validateUnverified || false}`);
    console.log(`📊 Batch size: ${batchSize || 1}`);
    console.log(`📊 Specific supplier IDs: ${supplierIds?.join(', ') || 'none'}`);


    // supabase is already created above with service role for admin check

    // Check if validation is enabled and not paused
    console.log('\n🔧 Loading validation config from database...');
    const { data: config } = await supabase
      .from('validation_config')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (!config || !config.enabled) {
      console.log('⚠️ Automated validation is disabled in config');
      return new Response(
        JSON.stringify({ message: 'Validation disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Validation config loaded successfully!');
    console.log('🔧 Config details:', JSON.stringify({ 
      enabled: config.enabled, 
      paused: config.validation_paused,
      monthCount: config.validations_this_month,
      monthLimit: config.monthly_validation_limit,
      autoApproveMissingData: config.auto_approve_missing_data,
      autoApproveTech: config.auto_approve_technology_updates,
      autoApproveMaterials: config.auto_approve_material_updates,
      autoApproveLocation: config.auto_approve_location_updates
    }, null, 2));

    if (config.validation_paused) {
      console.log('Validation is paused by user');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Validation is paused',
          validated: 0,
          updated: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we've hit the monthly limit
    const monthlyLimit = config.monthly_validation_limit || 310;
    if (config.validations_this_month >= monthlyLimit) {
      console.log(`Monthly validation limit reached: ${config.validations_this_month}/${monthlyLimit}`);
      
      // Auto-pause validation until next month
      await supabase
        .from('validation_config')
        .update({ validation_paused: true })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Monthly validation limit reached. Validation paused until next month.',
          validated: 0,
          updated: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Monthly validations: ${config.validations_this_month}/${monthlyLimit}`);

    // Get suppliers to validate
    console.log('\n🔍 Building supplier query...');
    
    let suppliers;
    let suppliersError;
    
    // NEW: If specific supplier IDs are provided, fetch those directly
    if (supplierIds && supplierIds.length > 0) {
      console.log(`🎯 Fetching specific suppliers by ID: ${supplierIds.join(', ')}`);
      const result = await supabase
        .from('suppliers')
        .select('*')
        .in('supplier_id', supplierIds);
      
      suppliers = result.data;
      suppliersError = result.error;
      console.log(`📋 Found ${suppliers?.length || 0} of ${supplierIds.length} requested suppliers`);
    } else {
      // Original query logic for batch validation
      let query = supabase.from('suppliers').select('*');

      // Always exclude suppliers with 5+ consecutive failures (they are likely unreachable)
      query = query.or('validation_failures.is.null,validation_failures.lt.5');
      
      // Exclude suppliers that failed validation (confidence=0) in the last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      if (validateUnverified) {
        // Validate only unverified suppliers
        console.log('🎯 Targeting unverified suppliers only');
        query = query.eq('verified', false);
      } else if (!validateAll) {
        // Prioritize suppliers with:
        // 1. Never validated (last_validated_at is null) - highest priority
        // 2. Not verified yet
        // 3. Have default/missing coordinates
        // 4. Haven't been validated in 30+ days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        query = query.or(`last_validated_at.is.null,verified.eq.false,location_lat.eq.13.4,location_lat.is.null,last_validated_at.lt.${thirtyDaysAgo.toISOString()}`);
        
        // Skip suppliers that recently failed with 0 confidence (within last 24h)
        // This is done by checking last_validation_confidence > 0 OR last_validated_at is null OR old enough
        query = query.or(`last_validation_confidence.gt.0,last_validation_confidence.is.null,last_validated_at.is.null,last_validated_at.lt.${twentyFourHoursAgo.toISOString()}`);
      }

      // Order by: never validated first, then unverified, then low confidence, then oldest validated
      query = query
        .order('last_validated_at', { ascending: true, nullsFirst: true }) // Never validated = highest priority
        .order('verified', { ascending: true, nullsFirst: true }) // Unverified = higher priority
        .order('validation_failures', { ascending: true, nullsFirst: true }) // Fewer failures = higher priority
        .order('last_validation_confidence', { ascending: true, nullsFirst: true }); // Low confidence = high priority

      // Determine batch size
      const limitCount = validateUnverified ? (batchSize || 10) : 1; // Default to 10 for bulk unverified, 1 for normal (24/day)
      console.log(`🎯 Query limit: ${limitCount} supplier(s)`);
      console.log('📡 Executing supplier query...');
      
      const result = await query.limit(limitCount);
      suppliers = result.data;
      suppliersError = result.error;
    }

    if (suppliersError) {
      throw suppliersError;
    }

    console.log(`🎯 Found ${suppliers?.length || 0} suppliers to validate`);
    
    if (!suppliers || suppliers.length === 0) {
      console.log('✅ No suppliers need validation at this time');
      console.log('🔍 Query criteria used:');
      console.log(`   - Validate unverified: ${validateUnverified}`);
      console.log(`   - Specific IDs: ${supplierIds?.join(', ') || 'none'}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No suppliers to validate',
          validated: 0,
          updated: 0,
          criteria: {
            validateUnverified,
            supplierIds: supplierIds || []
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let validated = 0;
    let updated = 0;
    
    console.log('📋 Suppliers to validate:', suppliers.map(s => s.name).join(', '));

    for (const supplier of suppliers || []) {
      try {
        console.log(`\n\n🔍 ========== VALIDATING SUPPLIER: ${supplier.name} ==========`);
        console.log(`📝 Supplier ID: ${supplier.supplier_id}`);
        console.log(`🌐 Website: ${supplier.website}`);
        console.log(`📍 Current location: ${supplier.location_address || 'N/A'}`);
        console.log(`🔧 Current technologies: ${supplier.technologies?.length || 0}`);
        console.log(`🧪 Current materials: ${supplier.materials?.length || 0}`);
        
        // Call the validate-supplier function with service role authorization
        console.log('📞 Calling validate-supplier edge function...');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const validateResponse = await supabase.functions.invoke('validate-supplier', {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`
          },
          body: {
            supplierId: supplier.supplier_id,
            supplierName: supplier.name,
            supplierWebsite: supplier.website,
            currentTechnologies: supplier.technologies || [],
            currentMaterials: supplier.materials || [],
            currentLocation: supplier.location_address || ''
          }
        });

        if (validateResponse.error) {
          const errorMsg = validateResponse.error.message || JSON.stringify(validateResponse.error);
          const errorContext = validateResponse.error.context || '';
          // Ensure errorContext is a string before calling toLowerCase
          const errorContextStr = typeof errorContext === 'string' 
            ? errorContext 
            : JSON.stringify(errorContext);
          console.error(`❌ Validation error for ${supplier.name}:`, errorMsg);
          
          // Increment failure counter for this supplier
          const currentFailures = supplier.validation_failures || 0;
          const newFailureCount = currentFailures + 1;
          console.log(`📊 Incrementing failure count for ${supplier.name}: ${currentFailures} -> ${newFailureCount}`);
          
          await supabase
            .from('suppliers')
            .update({ 
              validation_failures: newFailureCount,
              last_validated_at: new Date().toISOString(),
              last_validation_confidence: 0 // Explicitly set to 0 so they sort after successful suppliers
            })
            .eq('supplier_id', supplier.supplier_id);
          
          if (newFailureCount >= 5) {
            console.log(`🚫 ${supplier.name} has failed ${newFailureCount} times - will be skipped in future validations`);
          }
          
          // Check for infrastructure issues (503 = gateway unavailable)
          const isGatewayError = errorMsg.includes('503') || 
                                 errorMsg.toLowerCase().includes('gateway unavailable') ||
                                 errorContextStr.toLowerCase().includes('503') ||
                                 errorContextStr.toLowerCase().includes('connection refused');
          
          if (isGatewayError) {
            console.log(`🔌 Gateway error (503) - Infrastructure issue, not pausing validation`);
            console.log(`💡 This is temporary - validation will retry on next schedule`);
            continue; // Skip this supplier and move to next
          }
          
          // Check if AI API credits are exhausted (429 = rate limit, 402 = payment required)
          const isRateLimitError = errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit');
          const isPaymentError = errorMsg.includes('402') || 
                                 errorMsg.includes('FunctionsHttpError') ||
                                 errorMsg.toLowerCase().includes('payment required') || 
                                 errorMsg.toLowerCase().includes('credits exhausted') ||
                                 errorMsg.toLowerCase().includes('not enough credits') ||
                                 errorContextStr.toLowerCase().includes('402') ||
                                 errorContextStr.toLowerCase().includes('credits');
          
          if (isRateLimitError || isPaymentError) {
            const errorType = isPaymentError ? 'Credits exhausted (402)' : 'Rate limit exceeded (429)';
            console.log(`🛑 ${errorType} - Auto-pausing validation`);
            
            // Auto-pause validation to prevent further errors (FIXED: use config.id instead of configData.id)
            const { error: pauseError } = await supabase
              .from('validation_config')
              .update({ 
                validation_paused: true,
                last_pause_reason: errorType,
                last_pause_at: new Date().toISOString()
              })
              .eq('id', config.id);
            
            if (pauseError) {
              console.error('Failed to auto-pause validation:', pauseError);
            }
            
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: `${errorType}. Validation has been auto-paused. Please check your AI API credits and resume manually when ready.`,
                autoPaused: true,
                errorType: isPaymentError ? 'CREDITS_EXHAUSTED' : 'RATE_LIMIT'
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          continue;
        }
        
        // SUCCESS: Reset failure counter
        if (supplier.validation_failures && supplier.validation_failures > 0) {
          console.log(`✅ Resetting failure counter for ${supplier.name} (was ${supplier.validation_failures})`);
          await supabase
            .from('suppliers')
            .update({ validation_failures: 0 })
            .eq('supplier_id', supplier.supplier_id);
        }

        validated++;
        console.log(`✅ Validation API call completed for ${supplier.name}`);
        console.log('📦 Raw validation response:', JSON.stringify(validateResponse.data, null, 2));

        const validationResult = validateResponse.data?.data || validateResponse.data;
        console.log('📊 Extracted validation result:', JSON.stringify(validationResult, null, 2));
        
        console.log(`📊 Validation result for ${supplier.name}:`, {
          techMatch: validationResult.technologiesMatch,
          matMatch: validationResult.materialsMatch,
          locMatch: validationResult.locationMatch,
          confidence: validationResult.overallConfidence
        });

        // Auto-apply updates based on configuration
        if (config.auto_approve_missing_data || 
            config.auto_approve_technology_updates || 
            config.auto_approve_material_updates || 
            config.auto_approve_location_updates) {
          
          const updates: any = {};
          console.log('\n💾 Preparing auto-updates...');

          if (config.auto_approve_technology_updates && !validationResult.technologiesMatch) {
            console.log(`🔧 Will update technologies: ${validationResult.scrapedTechnologies?.join(', ') || 'none'}`);
            updates.technologies = validationResult.scrapedTechnologies;
          }

          if (config.auto_approve_material_updates && !validationResult.materialsMatch) {
            console.log(`🧪 Will update materials: ${validationResult.scrapedMaterials?.join(', ') || 'none'}`);
            updates.materials = validationResult.scrapedMaterials;
          }

          // Geocode location data - try scraped location first, fall back to existing city/country
          if (config.auto_approve_location_updates) {
            let locationToGeocode = '';
            const hasDefaultCoords = (supplier.location_lat === 13.4 && supplier.location_lng === 52.52) ||
                                    (supplier.location_lat === null || supplier.location_lng === null);
            
            // If validation found a new location, use that
            if (!validationResult.locationMatch && validationResult.scrapedLocation) {
              locationToGeocode = validationResult.scrapedLocation;
              console.log(`Using scraped location: ${locationToGeocode}`);
            }
            // Otherwise, if supplier has city/country but no valid coordinates, geocode that
            else if (supplier.location_city && supplier.location_country && hasDefaultCoords) {
              locationToGeocode = `${supplier.location_city}, ${supplier.location_country}`;
              console.log(`Using existing location data for geocoding: ${locationToGeocode}`);
            }
            
            if (locationToGeocode) {
              try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationToGeocode)}&format=json&limit=1`;
                const geocodeResponse = await fetch(geocodeUrl, {
                  headers: {
                    'User-Agent': 'AMSupplyCheck/1.0'
                  }
                });
                
                if (geocodeResponse.ok) {
                  const geocodeData = await geocodeResponse.json();
                  if (geocodeData && geocodeData.length > 0) {
                    const location = geocodeData[0];
                    updates.location_lat = parseFloat(location.lat);
                    updates.location_lng = parseFloat(location.lon);
                    
                    // If we used scraped location, also update the address
                    if (validationResult.scrapedLocation) {
                      updates.location_address = validationResult.scrapedLocation;
                    }
                    
                    // Extract or update city and country from display_name
                    const addressParts = location.display_name.split(',').map((p: string) => p.trim());
                    if (addressParts.length >= 2) {
                      updates.location_country = addressParts[addressParts.length - 1];
                      if (!supplier.location_city || validationResult.scrapedLocation) {
                        updates.location_city = addressParts[0];
                      }
                    }
                    
                    console.log(`📍 Geocoded location for ${supplier.name}: [${updates.location_lat}, ${updates.location_lng}]`);
                  } else {
                    console.log(`⚠️ No geocoding results for: ${locationToGeocode}`);
                  }
                }
                
                // Small delay to respect Nominatim rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (geocodeError) {
                console.error(`❌ Geocoding error for ${supplier.name}:`, geocodeError);
              }
            }
          }

          // Auto-update logo if found and missing data approval is enabled
          if (config.auto_approve_missing_data && validationResult.scrapedLogoUrl) {
            if (!supplier.logo_url) {
              updates.logo_url = validationResult.scrapedLogoUrl;
              console.log(`📸 Will update logo for ${supplier.name}: ${validationResult.scrapedLogoUrl}`);
            } else {
              console.log(`📸 Logo already exists for ${supplier.name}, skipping`);
            }
          } else if (!validationResult.scrapedLogoUrl) {
            console.log(`📸 No logo found for ${supplier.name}`);
          }

          if (Object.keys(updates).length > 0) {
            updates.last_validated_at = new Date().toISOString();
            // Only set verified=true if we have meaningful data (tech or materials)
            const hasMeaningfulData = (updates.technologies?.length > 0) || (updates.materials?.length > 0) || 
                                       (supplier.technologies?.length > 0) || (supplier.materials?.length > 0);
            const overallConfidence = validationResult.overallConfidence || validationResult.confidence?.overall || 0;
            updates.verified = hasMeaningfulData && overallConfidence > 0;
            updates.last_validation_confidence = overallConfidence;
            
            const { error: updateError } = await supabase
              .from('suppliers')
              .update(updates)
              .eq('supplier_id', supplier.supplier_id);

            if (updateError) {
              console.error(`❌ Update error for ${supplier.name}:`, updateError);
            } else {
              updated++;
              console.log(`💾 Auto-updated ${supplier.name} with fields:`, Object.keys(updates).join(', '));
            }
          }
        }

        // Only mark as verified if validation actually succeeded (confidence > 0)
        // AND we have some actual data (technologies OR materials)
        // AND the supplier is confirmed as a 3D printing provider
        const overallConfidence = validationResult.overallConfidence || validationResult.confidence?.overall || 0;
        const hasTechnologies = validationResult.scrapedTechnologies?.length > 0 || validationResult.scrapedData?.technologies?.length > 0;
        const hasMaterials = validationResult.scrapedMaterials?.length > 0 || validationResult.scrapedData?.materials?.length > 0;
        const is3dProvider = validationResult.scrapedData?.is_3d_printing_provider ?? validationResult.updated?.is_3d_printing_provider;
        const validationSucceeded = overallConfidence > 0 && (hasTechnologies || hasMaterials) && is3dProvider !== false;

        if (is3dProvider === false) {
          console.log(`⚠️ ${supplier.name} is NOT a 3D printing provider - will not be verified`);
        } else if (is3dProvider === true) {
          console.log(`✅ ${supplier.name} confirmed as 3D printing provider`);
        }

        const validationOnlyUpdate: any = {
          last_validated_at: new Date().toISOString(),
          verified: validationSucceeded, // Only verify if validation actually worked and is a 3D printing provider
          last_validation_confidence: overallConfidence
        };
        
        await supabase
          .from('suppliers')
          .update(validationOnlyUpdate)
          .eq('supplier_id', supplier.supplier_id);
        
        if (!validationSucceeded) {
          console.log(`⚠️ ${supplier.name} validation had 0 confidence or no data - NOT marking as verified`);
          // Increment failure count for failed validations
          const currentFailures = supplier.validation_failures || 0;
          await supabase
            .from('suppliers')
            .update({ validation_failures: currentFailures + 1 })
            .eq('supplier_id', supplier.supplier_id);
        }

        // Longer delay to avoid rate limiting and ensure quality
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`❌ Error processing ${supplier.name}:`, error);
      }
    }
    
    console.log('\n📈 Validation summary:', {
      validated,
      updated,
      monthlyCount: config.validations_this_month + validated,
      monthlyLimit: config.monthly_validation_limit
    });

    // Increment the validations counter
    if (validated > 0) {
      const newMonthlyCount = (config.validations_this_month || 0) + validated;
      const { error: updateConfigError } = await supabase
        .from('validation_config')
        .update({ 
          validations_this_month: newMonthlyCount 
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');
        
      if (updateConfigError) {
        console.error('❌ Failed to update validation counter:', updateConfigError);
      } else {
        console.log(`✅ Updated monthly counter to ${newMonthlyCount}`);
      }
    }

    console.log('🏁 ===== SCHEDULED VALIDATION COMPLETED =====\n');

    return new Response(
      JSON.stringify({ 
        success: true, 
        validated, 
        updated,
        message: `Validated ${validated} suppliers, auto-updated ${updated}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error server-side only
    console.error('Scheduled validation error:', {
      timestamp: new Date().toISOString(),
      errorType: error?.constructor?.name
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Validation process failed',
        code: 'VALIDATION_PROCESS_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
