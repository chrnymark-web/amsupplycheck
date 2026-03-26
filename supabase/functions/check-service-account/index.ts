import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('GA4_SERVICE_ACCOUNT_JSON');
    
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ error: 'GA4_SERVICE_ACCOUNT_JSON secret not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    
    return new Response(
      JSON.stringify({
        client_email: serviceAccount.client_email,
        project_id: serviceAccount.project_id,
        private_key_id: serviceAccount.private_key_id,
        has_private_key: !!serviceAccount.private_key
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error checking service account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
