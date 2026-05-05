import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REPO = 'chrnymark-web/amsupplycheck';
const BRANCH_PREFIX = 'auto-audit/';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('GITHUB_AUDIT_PAT');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'GITHUB_AUDIT_PAT not configured', prs: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = `https://api.github.com/repos/${REPO}/pulls?state=open&per_page=50&sort=created&direction=desc`;
    const ghRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'supplycheck-audit-dashboard',
      },
    });

    if (!ghRes.ok) {
      const body = await ghRes.text();
      return new Response(
        JSON.stringify({ error: `GitHub API ${ghRes.status}: ${body.slice(0, 200)}`, prs: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const raw = await ghRes.json() as Array<{
      number: number;
      title: string;
      html_url: string;
      draft: boolean;
      created_at: string;
      head: { ref: string };
      body: string | null;
    }>;

    const prs = raw
      .filter(pr => pr.head?.ref?.startsWith(BRANCH_PREFIX) || pr.title?.startsWith('Audit:'))
      .map(pr => ({
        number: pr.number,
        title: pr.title,
        html_url: pr.html_url,
        draft: pr.draft,
        created_at: pr.created_at,
        head_ref: pr.head?.ref ?? '',
        body_excerpt: (pr.body ?? '').slice(0, 280),
      }));

    return new Response(JSON.stringify({ prs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error), prs: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
