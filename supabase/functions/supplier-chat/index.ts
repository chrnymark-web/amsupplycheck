import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are a friendly and expert AI assistant for AMSupplyCheck, a platform that helps users find 3D printing suppliers.

YOUR ROLE:
- Help users find the right supplier for their needs
- Ask follow-up questions to better understand their requirements
- Explain technologies and materials in an accessible way
- Recommend based on use case, requirements, and location

AVAILABLE 3D PRINTING TECHNOLOGIES:
- FDM/FFF: Affordable, fast prototyping, large parts. Materials: PLA, ABS, PETG, Nylon
- SLA: High precision, smooth surface. Materials: Resins (Standard, Tough, Flexible)
- SLS: Production parts, complex geometries. Materials: Nylon PA-12, PA-11
- Multi Jet Fusion (MJF): High volume production, strong parts. Materials: PA-12, PA-11, TPU
- DMLS/SLM: Metal 3D printing. Materials: Titanium, Aluminum, Stainless Steel, Inconel
- DLP: Fast resin printing with high detail
- Material Jetting: Multi-color, multi-material
- Binder Jetting: Large metal and sand molds

MATERIAL GUIDE:
- Prototypes: PLA, Standard Resin
- Functional parts: Nylon PA-12, ABS, PETG
- Flexible parts: TPU, Flexible Resin
- High temperature: ULTEM, Inconel
- Strong parts: Carbon Fiber Reinforced, Nylon Glass Filled
- Metal production: Titanium Ti-6Al-4V, Stainless Steel 316L, Aluminum AlSi10Mg

REGIONS:
- Scandinavia (Denmark, Sweden, Norway, Finland)
- Western Europe (France, Netherlands, Belgium, Spain, Italy)
- Central Europe (Germany, Austria, Switzerland)
- UK & Ireland
- North America (USA, Canada)
- Asia Pacific
- Global

CONVERSATION RULES:
1. Start by understanding the user's needs - ask about:
   - What will the part be used for? (prototype, production, one-off)
   - What properties are important? (strength, flexibility, temperature resistance, precision)
   - How many pieces? (1-10, 10-100, 100+)
   - Geographic preferences?
   
2. Based on the answers, recommend:
   - Appropriate technology
   - Suitable materials
   - Search for relevant suppliers

3. Be proactive - if the user mentions an industry (aerospace, medical, automotive), suggest appropriate materials and certifications.

4. Keep answers short and focused. Ask one question at a time to avoid overwhelming the user.

5. When you have enough information, use the search_suppliers function to find suppliers.

IMPORTANT:
- Always respond in English
- Be friendly and helpful
- Explain technical terms when necessary
- Give concrete recommendations based on user needs`;

// Available tools for the AI
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_suppliers',
      description: 'Search for 3D printing suppliers based on specific criteria. Use this when you have enough information about what the user needs.',
      parameters: {
        type: 'object',
        properties: {
          technologies: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of technologies to filter by (e.g., "FDM/FFF", "SLS", "DMLS", "Multi Jet Fusion")'
          },
          materials: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of materials to filter by (e.g., "Nylon PA-12", "Titanium Ti-6Al-4V")'
          },
          region: {
            type: 'string',
            description: 'Geographic region to filter by (e.g., "Scandinavia", "Central Europe")'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of suppliers to return (default 5)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_supplier_details',
      description: 'Get detailed information about a specific supplier by their ID',
      parameters: {
        type: 'object',
        properties: {
          supplier_id: {
            type: 'string',
            description: 'The unique supplier_id to get details for'
          }
        },
        required: ['supplier_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'match_project',
      description: 'Match a detailed project description against all suppliers and return the best matches with scores. Use this when the user describes a specific project with details like materials, requirements, quantities, or use-case.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Full project description from the user'
          },
          quantity: {
            type: 'string',
            description: 'Production quantity (e.g., "1-10", "100-1000")'
          },
          preferredRegion: {
            type: 'string',
            description: 'Preferred geographic region'
          }
        },
        required: ['description']
      }
    }
  }
];

// Search suppliers in database
async function searchSuppliers(
  supabase: ReturnType<typeof createClient>,
  params: { technologies?: string[]; materials?: string[]; region?: string; limit?: number }
): Promise<any[]> {
  const { technologies, materials, region, limit = 5 } = params;
  
  // Map AI region names to database region values
  const regionMap: Record<string, string> = {
    'scandinavia': 'europe', 'western europe': 'europe', 'central europe': 'europe',
    'eastern europe': 'europe', 'uk & ireland': 'europe', 'nordic': 'europe',
    'southern europe': 'europe', 'northern europe': 'europe',
    'north america': 'northamerica', 'usa': 'northamerica', 'united states': 'northamerica', 'canada': 'northamerica',
    'asia': 'asia', 'asia-pacific': 'asia', 'asia pacific': 'asia',
    'middle east': 'middleeast', 'gulf': 'middleeast',
    'south america': 'southamerica', 'latin america': 'southamerica',
    'africa': 'africa',
  };
  const dbRegion = region ? (regionMap[region.toLowerCase()] || region.toLowerCase()) : null;

  // Fetch more suppliers (200) to filter in memory for better results
  let query = supabase
    .from('suppliers')
    .select('supplier_id, name, website, description, technologies, materials, region, location_city, location_country, verified, premium, logo_url')
    .eq('verified', true)
    .limit(200);

  // Filter by region at DB level
  if (dbRegion) {
    query = query.eq('region', dbRegion);
  }

  // Execute query
  const { data, error } = await query;

  if (error) {
    console.error('Error searching suppliers:', error);
    return [];
  }

  // Filter by technologies and materials in memory (fuzzy matching)
  let results = data || [];

  if (technologies && technologies.length > 0) {
    results = results.filter(s =>
      s.technologies && s.technologies.some((t: string) => {
        const tNorm = t.toLowerCase().replace(/[^a-z0-9]/g, '');
        return technologies.some(tech => {
          const techNorm = tech.toLowerCase().replace(/[^a-z0-9]/g, '');
          return tNorm.includes(techNorm) || techNorm.includes(tNorm) ||
                 t.toLowerCase() === tech.toLowerCase();
        });
      })
    );
  }

  if (materials && materials.length > 0) {
    results = results.filter(s =>
      s.materials && s.materials.some((m: string) => {
        const mNorm = m.toLowerCase().replace(/[^a-z0-9]/g, '');
        return materials.some(mat => {
          const matNorm = mat.toLowerCase().replace(/[^a-z0-9]/g, '');
          return mNorm.includes(matNorm) || matNorm.includes(mNorm) ||
                 m.toLowerCase() === mat.toLowerCase();
        });
      })
    );
  }
  
  // Sort: premium first, then verified
  results.sort((a, b) => {
    if (a.premium && !b.premium) return -1;
    if (!a.premium && b.premium) return 1;
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return 0;
  });
  
  return results.slice(0, limit);
}

// Get supplier details
async function getSupplierDetails(
  supabase: ReturnType<typeof createClient>,
  supplierId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('supplier_id', supplierId)
    .maybeSingle();
  
  if (error) {
    console.error('Error getting supplier details:', error);
    return null;
  }
  
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input to prevent token exhaustion and prompt injection
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim().slice(0, 100) : '';
    
    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Message (max 2000 chars) and sessionId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!/^chat_\d+_[a-z0-9]+$/.test(sessionId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid sessionId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Chat request - Session:', sessionId, 'Message:', message.substring(0, 100));

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

    // Get or create session
    let { data: session } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!session) {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({ session_id: sessionId, messages: [], context: {} })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating session:', createError);
      }
      session = newSession;
    }

    // Get conversation history (last 20 messages for context)
    const messages = (session?.messages || []).slice(-20);
    
    // Add user message to history
    messages.push({ role: 'user', content: message });

    // Build messages for AI
    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Call AI with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        tools: TOOLS,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    let fullContent = '';
    let toolCalls: any[] = [];
    let currentToolCall: any = null;
    
    // Create a TransformStream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    
    // Process the stream in background
    (async () => {
      try {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                fullContent += delta.content;
                // Send content chunk to client
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`));
              }
              
              // Handle tool calls
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.index !== undefined) {
                    if (!currentToolCall || currentToolCall.index !== tc.index) {
                      if (currentToolCall) {
                        toolCalls.push(currentToolCall);
                      }
                      currentToolCall = {
                        index: tc.index,
                        id: tc.id || '',
                        function: {
                          name: tc.function?.name || '',
                          arguments: tc.function?.arguments || ''
                        }
                      };
                    } else {
                      if (tc.function?.name) {
                        currentToolCall.function.name += tc.function.name;
                      }
                      if (tc.function?.arguments) {
                        currentToolCall.function.arguments += tc.function.arguments;
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
        
        // Add last tool call if exists
        if (currentToolCall) {
          toolCalls.push(currentToolCall);
        }
        
        // Process tool calls if any
        if (toolCalls.length > 0) {
          console.log('Processing tool calls:', toolCalls.length);
          
          for (const tc of toolCalls) {
            const funcName = tc.function.name;
            let args = {};
            try {
              args = JSON.parse(tc.function.arguments);
            } catch (e) {
              console.error('Error parsing tool arguments:', e);
            }
            
            let result: any = null;
            
            if (funcName === 'search_suppliers') {
              console.log('Searching suppliers with:', args);
              result = await searchSuppliers(supabase, args as any);
              
              // Send suppliers to client
              await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'suppliers', suppliers: result })}\n\n`));
              
              // If we got results, add a follow-up message
              if (result.length > 0) {
                const supplierNames = result.map((s: any) => s.name).join(', ');
                const followUp = `\n\nI found ${result.length} suppliers matching your criteria: ${supplierNames}. Would you like to know more about any of them?`;
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: followUp })}\n\n`));
                fullContent += followUp;
              } else {
                const noResults = '\n\nUnfortunately, I couldn\'t find suppliers that match exactly. Try adjusting your criteria - perhaps a different region or broader technology requirements?';
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: noResults })}\n\n`));
                fullContent += noResults;
              }
            } else if (funcName === 'get_supplier_details') {
              console.log('Getting supplier details for:', args);
              result = await getSupplierDetails(supabase, (args as any).supplier_id);
              
              if (result) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'supplier_detail', supplier: result })}\n\n`));
              }
            } else if (funcName === 'match_project') {
              console.log('Matching project:', args);
              const matchArgs = args as { description: string; quantity?: string; preferredRegion?: string };
              
              // Call the ai-supplier-matching function
              try {
                const matchResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-supplier-matching`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  },
                  body: JSON.stringify({
                    project: {
                      description: matchArgs.description,
                      quantity: matchArgs.quantity,
                      preferredRegion: matchArgs.preferredRegion,
                    }
                  }),
                });

                if (matchResponse.ok) {
                  const matchData = await matchResponse.json();
                  
                  // Send match results to client
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'project_matches', 
                    matches: matchData.matches,
                    requirements: matchData.requirements
                  })}\n\n`));
                  
                  // Add a follow-up message
                  if (matchData.matches && matchData.matches.length > 0) {
                    const topMatches = matchData.matches.slice(0, 3);
                    const matchSummary = topMatches.map((m: any) => `${m.supplier.name} (${m.score}%)`).join(', ');
                    const followUp = `\n\nI've analyzed your project and found ${matchData.matches.length} suppliers! The best matches are: ${matchSummary}. You can see all the details above. Would you like to know more about a specific supplier?`;
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: followUp })}\n\n`));
                    fullContent += followUp;
                  } else {
                    const noMatches = '\n\nUnfortunately, I couldn\'t find suppliers matching your project. Try describing the project differently or broaden your requirements.';
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: noMatches })}\n\n`));
                    fullContent += noMatches;
                  }
                } else {
                  console.error('Match function error:', await matchResponse.text());
                  const errorMsg = '\n\nSorry, an error occurred during matching. Try again or use the regular supplier search.';
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: errorMsg })}\n\n`));
                  fullContent += errorMsg;
                }
              } catch (matchError) {
                console.error('Match function exception:', matchError);
                const errorMsg = '\n\nSorry, matching could not be completed. Please try again later.';
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: errorMsg })}\n\n`));
                fullContent += errorMsg;
              }
            }
          }
        }
        
        // Save conversation to database
        const updatedMessages = [...messages, { role: 'assistant', content: fullContent }];
        
        await supabase
          .from('chat_sessions')
          .update({ 
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);

        // Log chat analytics
        const toolsUsed = toolCalls.map(tc => tc.function.name);
        const suppliersMentioned = toolCalls
          .filter(tc => tc.function.name === 'search_suppliers' || tc.function.name === 'get_supplier_details')
          .map(tc => {
            try { return JSON.parse(tc.function.arguments); } catch { return {}; }
          });

        try {
          await supabase.from('chat_analytics').insert({
            session_id: sessionId,
            message_count: updatedMessages.length,
            tools_used: toolsUsed,
            suppliers_mentioned: [],
            topics_discussed: []
          });
        } catch (e) {
          console.error('Failed to log chat analytics:', e);
        }
        
        // Send done signal
        await writer.write(encoder.encode(`data: [DONE]\n\n`));
        await writer.close();
        
      } catch (error) {
        console.error('Stream processing error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream processing error' })}\n\n`));
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
