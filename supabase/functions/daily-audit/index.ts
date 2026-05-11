import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// verify_jwt=false in supabase/config.toml — invoked via pg_net cron with x-audit-secret header.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-audit-secret',
};

const REPO = 'chrnymark-web/amsupplycheck';
const RECENT_PR_DAYS = 14;
const CANDIDATE_BATCH_SIZE = 30;

interface SupplierCandidate {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  last_validation_confidence: number | null;
  last_validated_at: string | null;
  verified: boolean | null;
}

async function getRecentAuditSupplierIds(token: string): Promise<Set<string>> {
  const since = new Date(Date.now() - RECENT_PR_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const search = `repo:${REPO} is:pr created:>=${since} in:title "Audit:"`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(search)}&per_page=100`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'supplycheck-daily-audit',
    },
  });

  if (!res.ok) {
    console.warn(`GitHub search failed (${res.status}); treating PR list as empty.`);
    return new Set();
  }

  const data = (await res.json()) as { items?: Array<{ title: string }> };
  const ids = new Set<string>();
  for (const item of data.items ?? []) {
    const match = item.title?.match(/Audit:\s+([^(]+?)\s*(?:\(|$)/);
    if (match) {
      ids.add(match[1].trim().toLowerCase());
    }
  }
  return ids;
}

Deno.serve(async (req) => {
  console.log('🎬 DAILY-AUDIT INVOKED:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    const userAgent = req.headers.get('user-agent') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const auditSecret = req.headers.get('x-audit-secret');

    const isAuthorized =
      userAgent.includes('pg_net') ||
      (authHeader && authHeader.replace('Bearer ', '') === serviceRoleKey) ||
      auditSecret === 'cron-trigger-internal';

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: candidates, error: queryError } = await supabase
      .from('suppliers')
      .select('id, supplier_id, name, website, last_validation_confidence, last_validated_at, verified')
      .not('website', 'is', null)
      .or('validation_failures.is.null,validation_failures.lt.5')
      .order('last_validation_confidence', { ascending: true, nullsFirst: true })
      .order('last_validated_at', { ascending: true, nullsFirst: true })
      .limit(CANDIDATE_BATCH_SIZE);

    if (queryError) {
      console.error('Supplier query failed:', queryError);
      throw queryError;
    }

    const ghToken = Deno.env.get('GITHUB_AUDIT_PAT');
    const recentNames = ghToken ? await getRecentAuditSupplierIds(ghToken) : new Set<string>();
    console.log(`🔎 Found ${recentNames.size} suppliers with recent audit PRs to skip.`);

    let chosen: SupplierCandidate | null = null;
    for (const candidate of (candidates ?? []) as SupplierCandidate[]) {
      if (!recentNames.has(candidate.name.toLowerCase())) {
        chosen = candidate;
        break;
      }
    }

    const payload = chosen
      ? {
          type: 'audit_run' as const,
          status: 'candidate' as const,
          supplierName: chosen.name,
          supplierRowId: chosen.id,
          website: chosen.website ?? '',
          confidence: chosen.last_validation_confidence ?? 0,
          lastValidatedAt: chosen.last_validated_at,
          verified: chosen.verified ?? false,
          queueLength: candidates?.length ?? 0,
          skippedRecentAudits: recentNames.size,
        }
      : {
          type: 'audit_run' as const,
          status: 'empty' as const,
          queueLength: candidates?.length ?? 0,
          skippedRecentAudits: recentNames.size,
        };

    console.log('📨 Sending audit notification:', JSON.stringify(payload, null, 2));

    const { error: notifyError } = await supabase.functions.invoke('send-signup-notification', {
      body: payload,
    });

    if (notifyError) {
      console.error('Notification invoke failed:', notifyError);
    }

    return new Response(
      JSON.stringify({ success: true, ...payload }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('daily-audit error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
