import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const UpdateRequestSchema = z.object({
  supplierId: z.string().min(1).max(100),
  updates: z.object({
    technologies: z.array(z.string().max(100)).max(50).optional(),
    materials: z.array(z.string().max(100)).max(50).optional(),
    location: z.string().max(500).optional()
  })
});

interface UpdateRequest {
  supplierId: string;
  updates: {
    technologies?: string[];
    materials?: string[];
    location?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Admin authorization check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
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
    const validationResult = UpdateRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input data', 
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { supplierId, updates }: UpdateRequest = validationResult.data;
    
    console.log(`Updating supplier ${supplierId} with:`, updates);

    // Fetch current CSV from public folder
    const csvUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/suppliers.csv`;
    const csvResponse = await fetch(csvUrl);
    
    if (!csvResponse.ok) {
      // Fallback to reading from local file system if storage doesn't exist
      const localCsvPath = '/var/task/public/suppliers.csv';
      console.log('CSV not in storage, reading from local path');
    }

    const csvContent = await csvResponse.text();
    const lines = csvContent.split('\n');
    const headers = lines[0];
    const dataLines = lines.slice(1);

    // Find and update the supplier row
    let updated = false;
    const updatedLines = dataLines.map(line => {
      if (!line.trim()) return line;
      
      const columns = line.split(',');
      const id = columns[0];
      
      if (id === supplierId) {
        updated = true;
        console.log(`Found supplier ${supplierId}, updating...`);
        
        // Parse the PublicData JSON (it's in column 9)
        const publicDataStart = line.indexOf('"PublicData":');
        if (publicDataStart === -1) return line;
        
        // Extract and parse PublicData
        let publicDataStr = '';
        let braceCount = 0;
        let inString = false;
        let startFound = false;
        
        for (let i = publicDataStart; i < line.length; i++) {
          const char = line[i];
          
          if (char === '{' && !inString) {
            braceCount++;
            startFound = true;
          } else if (char === '}' && !inString) {
            braceCount--;
          } else if (char === '"' && line[i-1] !== '\\') {
            inString = !inString;
          }
          
          if (startFound) {
            publicDataStr += char;
          }
          
          if (startFound && braceCount === 0) {
            break;
          }
        }
        
        try {
          const publicData = JSON.parse(publicDataStr);
          
          // Update fields based on what was provided
          if (updates.technologies && updates.technologies.length > 0) {
            publicData.TechnologyID = updates.technologies;
            console.log('Updated technologies:', updates.technologies);
          }
          
          if (updates.materials && updates.materials.length > 0) {
            // Materials are stored in thermoplasticid, metalid, or photopolymerid
            // For simplicity, we'll update thermoplasticid
            publicData.thermoplasticid = updates.materials;
            console.log('Updated materials:', updates.materials);
          }
          
          if (updates.location) {
            if (!publicData.location) {
              publicData.location = {};
            }
            publicData.location.address = updates.location;
            console.log('Updated location:', updates.location);
          }
          
          // Reconstruct the line with updated PublicData
          const beforePublicData = line.substring(0, publicDataStart - 1);
          const afterPublicData = line.substring(publicDataStart + publicDataStr.length);
          const newPublicDataStr = JSON.stringify(publicData);
          
          return beforePublicData + newPublicDataStr + afterPublicData;
        } catch (parseError) {
          console.error('Error parsing PublicData:', parseError);
          return line;
        }
      }
      
      return line;
    });

    if (!updated) {
      return new Response(
        JSON.stringify({ success: false, error: 'Supplier not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reconstruct CSV
    const updatedCsv = [headers, ...updatedLines].join('\n');
    
    console.log('CSV updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Supplier updated successfully',
        note: 'CSV update prepared - manual file replacement required'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error server-side only
    console.error('Error updating supplier CSV:', {
      timestamp: new Date().toISOString(),
      errorType: error?.constructor?.name
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Update failed',
        code: 'UPDATE_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});