import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

// verify_jwt=false in supabase/config.toml — invoked via pg_net cron with x-welcome-secret header.
// Sends a personalised welcome email to a new supplier ~5 minutes after they sign up
// via SupplierFormDialog (insert into supplier_applications). Rows are marked with
// welcome_email_sent_at on success so they are not sent twice.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-welcome-secret',
};

const FROM_ADDRESS = 'SupplyCheck <info@supplycheck.io>';
const REPLY_TO = 'info@supplycheck.io';
const BATCH_LIMIT = 50;
const DELAY_MINUTES = 5;

interface PendingApplication {
  id: string;
  name: string;
  email: string;
  company: string;
}

function firstNameOf(fullName: string): string {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0];
}

function renderText(firstName: string, company: string): string {
  return `Hi ${firstName},

Thanks for signing up on SupplyCheck, great to have ${company} on board.

We started SupplyCheck as a side project, but it's been growing steadily with more suppliers joining, more referrals coming in, and traffic increasing week over week. So we want to make sure you're getting real value out of being on the platform.

I'd love to jump on a quick call to walk you through what we can offer, from your free listing to things like verified profiles, price calculators, and direct leads from buyers looking for exactly your capabilities.

The goal is simple: help you connect with the right type of customers for your business.

Would you be up for a 15-minute call sometime next week?

Best,
Christian
SupplyCheck.io`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
  );
}

function renderHtml(firstName: string, company: string): string {
  const safeFirst = escapeHtml(firstName);
  const safeCompany = escapeHtml(company);
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.55; color: #1a1a1a; max-width: 600px;">
<p>Hi ${safeFirst},</p>
<p>Thanks for signing up on SupplyCheck, great to have ${safeCompany} on board.</p>
<p>We started SupplyCheck as a side project, but it's been growing steadily with more suppliers joining, more referrals coming in, and traffic increasing week over week. So we want to make sure you're getting real value out of being on the platform.</p>
<p>I'd love to jump on a quick call to walk you through what we can offer, from your free listing to things like verified profiles, price calculators, and direct leads from buyers looking for exactly your capabilities.</p>
<p>The goal is simple: help you connect with the right type of customers for your business.</p>
<p>Would you be up for a 15-minute call sometime next week?</p>
<p>Best,<br>Christian<br>SupplyCheck.io</p>
</div>`;
}

Deno.serve(async (req) => {
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
    const welcomeSecret = req.headers.get('x-welcome-secret');

    const isAuthorized =
      userAgent.includes('pg_net') ||
      (authHeader && authHeader.replace('Bearer ', '') === serviceRoleKey) ||
      welcomeSecret === 'cron-trigger-internal';

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY missing — cannot send welcome emails');
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const resend = new Resend(resendApiKey);

    const cutoffIso = new Date(Date.now() - DELAY_MINUTES * 60 * 1000).toISOString();

    const { data: pending, error: queryError } = await supabase
      .from('supplier_applications')
      .select('id, name, email, company')
      .is('welcome_email_sent_at', null)
      .lt('created_at', cutoffIso)
      .order('created_at', { ascending: true })
      .limit(BATCH_LIMIT);

    if (queryError) {
      console.error('Query failed:', queryError);
      throw queryError;
    }

    const rows = (pending ?? []) as PendingApplication[];
    console.log(`📬 Found ${rows.length} pending welcome email(s)`);

    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      if (!row.email) {
        console.warn(`Skipping row ${row.id} — missing email`);
        failed += 1;
        continue;
      }

      const firstName = firstNameOf(row.name);
      const company = (row.company ?? '').trim() || 'your business';

      try {
        const resp = await resend.emails.send({
          from: FROM_ADDRESS,
          to: [row.email],
          reply_to: REPLY_TO,
          subject: 'Your sign up on SupplyCheck.',
          text: renderText(firstName, company),
          html: renderHtml(firstName, company),
        });

        if ((resp as any)?.error) {
          console.error(`Resend rejected row ${row.id}:`, (resp as any).error);
          failed += 1;
          continue;
        }

        const { error: updateError } = await supabase
          .from('supplier_applications')
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq('id', row.id);

        if (updateError) {
          console.error(`Failed to mark row ${row.id} as sent:`, updateError);
          failed += 1;
          continue;
        }

        console.log(`✅ Sent welcome to ${row.email} (${firstName} / ${company})`);
        sent += 1;
      } catch (err: any) {
        console.error(`Send threw for row ${row.id}:`, err?.message ?? err);
        failed += 1;
      }
    }

    return new Response(
      JSON.stringify({ success: true, considered: rows.length, sent, failed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('send-supplier-welcome error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
