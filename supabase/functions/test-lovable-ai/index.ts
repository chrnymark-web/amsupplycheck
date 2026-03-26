import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    console.log('🔍 Testing Lovable AI connection...');
    console.log(`🔑 API Key present: ${!!LOVABLE_API_KEY}`);

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'AI service not configured',
          code: 'CONFIG_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Simple test request to Lovable AI
    const testPayload = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say "test successful" if you receive this.' }
      ],
      max_tokens: 50,
    };

    console.log('📤 Sending test request to Lovable AI gateway...');

    const startTime = Date.now();
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Request took ${duration}ms`);
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`📄 Response body (logged server-side): ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      console.error('❌ Test FAILED - API error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI service unavailable',
          code: 'AI_ERROR',
          duration_ms: duration,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200
        }
      );
    }

    const data = JSON.parse(responseText);
    const aiMessage = data.choices?.[0]?.message?.content || '';

    console.log('✅ Test PASSED');
    console.log(`🤖 AI Response: ${aiMessage}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'AI connection working',
        ai_response: aiMessage,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'AI test failed',
        code: 'AI_ERROR',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
