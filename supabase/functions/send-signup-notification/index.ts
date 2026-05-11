import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface SupplierApplicationNotification {
  type: "supplier_application";
  name: string;
  email: string;
  company: string;
}

interface NewsletterSignupNotification {
  type: "newsletter_signup";
  email: string;
}

interface AutoApprovalNotification {
  type: "auto_approval";
  supplierName: string;
  website: string;
  confidence: number;
  technologies: string[];
  materials: string[];
  location: string;
  description?: string;
  supplierRowId?: string;
  autoApproveThreshold: number;
  totalAutoApproved: number;
}

interface ValidationRunChange {
  name: string;
  supplierRowId: string | null;
  confidence: number;
  fieldsUpdated: string[];
  is3dProvider: boolean | null;
  error?: string;
}

interface ValidationRunNotification {
  type: "validation_run";
  checked: number;
  verified: number;
  improved: number;
  disqualified: number;
  errored: number;
  monthlyCount: number;
  monthlyLimit: number;
  changes: ValidationRunChange[];
}

interface AuditRunNotification {
  type: "audit_run";
  status: "candidate" | "empty";
  supplierName?: string;
  supplierRowId?: string;
  website?: string;
  confidence?: number;
  lastValidatedAt?: string | null;
  verified?: boolean;
  queueLength?: number;
  skippedRecentAudits?: number;
}

type NotificationRequest =
  | SupplierApplicationNotification
  | NewsletterSignupNotification
  | AutoApprovalNotification
  | ValidationRunNotification
  | AuditRunNotification;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Verify anon key (passed automatically by Supabase internal calls)
    // This function only sends to a hardcoded admin email, so risk is minimal
    console.log("Processing notification request");
    
    const data: NotificationRequest = await req.json();
    
    // Input validation
    if (!data.type || !["supplier_application", "newsletter_signup", "auto_approval", "validation_run", "audit_run"].includes(data.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid notification type", code: "INVALID_TYPE" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    if (data.type === "supplier_application" && (!data.name || !data.email || !data.company)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields for supplier application", code: "MISSING_FIELDS" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    if (data.type === "newsletter_signup" && !data.email) {
      return new Response(
        JSON.stringify({ error: "Missing email for newsletter signup", code: "MISSING_EMAIL" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    if (data.type === "auto_approval" && !data.supplierName) {
      return new Response(
        JSON.stringify({ error: "Missing supplier name for auto-approval notification", code: "MISSING_FIELDS" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    console.log("Sending notification email for:", data.type);

    let emailSubject: string | undefined;
    let emailHtml: string | undefined;

    if (data.type === "supplier_application") {
      // Sanitize user input to prevent HTML injection
      const safeName = data.name.replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));
      const safeEmail = data.email.replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));
      const safeCompany = data.company.replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));
      
      emailSubject = "New Supplier Application Received";
      emailHtml = `
        <h1>New Supplier Application</h1>
        <p>You have received a new supplier application with the following details:</p>
        <ul>
          <li><strong>Name:</strong> ${safeName}</li>
          <li><strong>Email:</strong> ${safeEmail}</li>
          <li><strong>Company:</strong> ${safeCompany}</li>
        </ul>
        <p>Please review this application in your admin dashboard.</p>
      `;
    } else if (data.type === "newsletter_signup") {
      const safeEmail = data.email.replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));
      
      emailSubject = "New Newsletter Signup";
      emailHtml = `
        <h1>New Newsletter Signup</h1>
        <p>A new user has subscribed to your newsletter:</p>
        <ul>
          <li><strong>Email:</strong> ${safeEmail}</li>
        </ul>
      `;
    } else if (data.type === "auto_approval") {
      const safeName = data.supplierName.replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));
      const safeWebsite = data.website.replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));
      const safeLocation = (data.location || 'Unknown').replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c));
      
      const techList = (data.technologies || []).slice(0, 5).join(', ') || 'Not specified';
      const matList = (data.materials || []).slice(0, 5).join(', ') || 'Not specified';
      
      emailSubject = `🚀 Auto-Approved: ${data.supplierName} (${data.confidence}%)`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Supplier Auto-Approved</h1>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #495057; font-size: 16px; margin-top: 0;">
              A new supplier has been automatically approved and added to SupplyCheck.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin: 16px 0;">
              <h2 style="margin: 0 0 16px 0; color: #212529; font-size: 20px;">${safeName}</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; width: 120px;">Website:</td>
                  <td style="padding: 8px 0;"><a href="${safeWebsite}" style="color: #6366F1;">${safeWebsite}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d;">Location:</td>
                  <td style="padding: 8px 0; color: #212529;">${safeLocation}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d;">Confidence:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: #8B5CF6; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600;">
                      ${data.confidence}%
                    </span>
                    <span style="color: #6c757d; margin-left: 8px;">(threshold: ${data.autoApproveThreshold}%)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; vertical-align: top;">Technologies:</td>
                  <td style="padding: 8px 0; color: #212529;">${techList}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; vertical-align: top;">Materials:</td>
                  <td style="padding: 8px 0; color: #212529;">${matList}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              This supplier is now being validated automatically. Total auto-approved this run: <strong>${data.totalAutoApproved}</strong>
            </p>
          </div>
        </div>
      `;
    }

    if (resend && emailSubject && emailHtml) {
      try {
        const emailResponse = await resend.emails.send({
          from: "AMSupplyCheck <onboarding@resend.dev>",
          to: ["info@supplycheck.io", "chr.nymark@gmail.com"],
          subject: emailSubject,
          html: emailHtml,
        });
        console.log("Email sent successfully:", emailResponse);
      } catch (emailErr) {
        console.error("Email send failed (continuing to Telegram):", emailErr);
      }
    } else if (!resend) {
      console.log("RESEND_API_KEY missing — skipping email");
    }

    // Telegram ping for auto-approvals (additive — email still goes out)
    let telegramStatus = "skipped: not auto_approval";
    if (data.type === "auto_approval") {
      const tgToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const tgChatId = Deno.env.get("TELEGRAM_CHAT_ID");

      if (tgToken && tgChatId) {
        const escapeHtml = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const tgName = escapeHtml(data.supplierName);
        const tgWebsite = escapeHtml(data.website);
        const tgLocation = escapeHtml(data.location || "Unknown");
        const tgTech = escapeHtml((data.technologies || []).join(", ") || "—");
        const tgMat = escapeHtml((data.materials || []).join(", ") || "—");
        const tgDescription = data.description
          ? escapeHtml(data.description.length > 600 ? `${data.description.slice(0, 600)}…` : data.description)
          : "";
        const adminLink = data.supplierRowId
          ? `https://amsupplycheck.com/admin/supplier/${encodeURIComponent(data.supplierRowId)}/edit`
          : "https://amsupplycheck.com/admin/suppliers";

        const tgText = [
          `🚀 <b>Auto-godkendt: ${tgName}</b> (${data.confidence}%)`,
          ...(tgDescription ? [``, `📝 ${tgDescription}`] : []),
          ``,
          `📍 ${tgLocation}`,
          `🔧 ${tgTech}`,
          `🧪 ${tgMat}`,
          `🌐 <a href="${tgWebsite}">${tgWebsite}</a>`,
          ``,
          `🔗 <a href="${adminLink}">Åbn i admin →</a>`,
          ``,
          `Total denne kørsel: <b>${data.totalAutoApproved}</b> · Threshold: ${data.autoApproveThreshold}%`,
        ].join("\n");

        try {
          const tgResp = await fetch(
            `https://api.telegram.org/bot${tgToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: tgChatId,
                parse_mode: "HTML",
                disable_web_page_preview: true,
                text: tgText,
              }),
            },
          );
          if (!tgResp.ok) {
            const tgBody = (await tgResp.text()).slice(0, 200);
            console.error("Telegram send failed:", tgResp.status, tgBody);
            telegramStatus = `http_${tgResp.status}: ${tgBody}`;
          } else {
            console.log("Telegram ping sent for auto-approval:", data.supplierName);
            telegramStatus = "ok";
          }
        } catch (tgErr: any) {
          console.error("Telegram send threw:", tgErr);
          telegramStatus = `threw: ${tgErr?.message ?? String(tgErr)}`;
        }
      } else {
        console.log("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing — skipping Telegram ping");
        telegramStatus = "skipped: missing env";
      }
    } else if (data.type === "validation_run") {
      const tgToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const tgChatId = Deno.env.get("TELEGRAM_CHAT_ID");

      if (tgToken && tgChatId) {
        const escapeHtml = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const headerLines = [
          `🔍 <b>Validering kørt</b> · ${data.checked} tjekket`,
          `✅ Verificeret: ${data.verified}  ·  ✨ Opdateret: ${data.improved}`,
          `⚠️ Ikke 3D-print: ${data.disqualified}  ·  ❌ Fejl: ${data.errored}`,
          `📊 Måned: ${data.monthlyCount}/${data.monthlyLimit}`,
        ];

        const changes = Array.isArray(data.changes) ? data.changes.slice(0, 10) : [];
        const changeLines: string[] = [];
        if (changes.length > 0) {
          changeLines.push("", "<b>Ændringer:</b>");
          for (const c of changes) {
            const tgName = escapeHtml(c.name || "Ukendt");
            const link = c.supplierRowId
              ? `https://amsupplycheck.com/admin/supplier/${encodeURIComponent(c.supplierRowId)}/edit`
              : null;
            const nameMarkup = link ? `<a href="${link}">${tgName}</a>` : tgName;
            const confidence = typeof c.confidence === "number" ? `${c.confidence}%` : "—";
            let detail: string;
            if (c.error) {
              detail = `❌ ${escapeHtml(c.error.slice(0, 80))}`;
            } else if (c.is3dProvider === false) {
              detail = "⚠️ ikke 3D-print";
            } else if (c.fieldsUpdated && c.fieldsUpdated.length > 0) {
              detail = escapeHtml(c.fieldsUpdated.join(", "));
            } else {
              detail = "verificeret";
            }
            changeLines.push(`• ${nameMarkup} (${confidence}) — ${detail}`);
          }
          const totalChanges =
            Array.isArray(data.changes) ? data.changes.length : 0;
          if (totalChanges > changes.length) {
            changeLines.push(`<i>(+${totalChanges - changes.length} flere ikke vist)</i>`);
          }
        }

        const tgText = [...headerLines, ...changeLines].join("\n");

        try {
          const tgResp = await fetch(
            `https://api.telegram.org/bot${tgToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: tgChatId,
                parse_mode: "HTML",
                disable_web_page_preview: true,
                text: tgText,
              }),
            },
          );
          if (!tgResp.ok) {
            const tgBody = (await tgResp.text()).slice(0, 200);
            console.error("Telegram send failed:", tgResp.status, tgBody);
            telegramStatus = `http_${tgResp.status}: ${tgBody}`;
          } else {
            console.log(`Telegram ping sent for validation_run: ${data.checked} checked`);
            telegramStatus = "ok";
          }
        } catch (tgErr: any) {
          console.error("Telegram send threw:", tgErr);
          telegramStatus = `threw: ${tgErr?.message ?? String(tgErr)}`;
        }
      } else {
        console.log("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing — skipping Telegram ping");
        telegramStatus = "skipped: missing env";
      }
    } else if (data.type === "audit_run") {
      const tgToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const tgChatId = Deno.env.get("TELEGRAM_CHAT_ID");

      if (tgToken && tgChatId) {
        const escapeHtml = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        let tgText: string;
        if (data.status === "empty") {
          tgText = [
            `🌴 <b>Audit-kø er ren</b>`,
            ``,
            `Ingen suppliers under confidence-grænsen uden en åben audit-PR fra de seneste 14 dage.`,
            data.skippedRecentAudits != null
              ? `Sprunget over: ${data.skippedRecentAudits} med nylig PR.`
              : ``,
          ].filter(Boolean).join("\n");
        } else {
          const name = escapeHtml(data.supplierName || "Ukendt");
          const website = escapeHtml(data.website || "");
          const confidence = typeof data.confidence === "number"
            ? `${data.confidence}%`
            : "—";
          const lastValidated = data.lastValidatedAt
            ? new Date(data.lastValidatedAt).toISOString().slice(0, 10)
            : "aldrig";
          const verifiedTag = data.verified ? "verificeret" : "uverificeret";
          const adminLink = data.supplierRowId
            ? `https://amsupplycheck.com/admin/supplier/${encodeURIComponent(data.supplierRowId)}/edit`
            : "https://amsupplycheck.com/admin/suppliers";
          const websiteLink = website
            ? `<a href="${website}">${website}</a>`
            : "(intet website)";

          tgText = [
            `🔍 <b>Dagens audit-kandidat</b>`,
            ``,
            `<b>${name}</b> · ${confidence} · ${verifiedTag}`,
            `🌐 ${websiteLink}`,
            `📅 Sidst valideret: ${lastValidated}`,
            ``,
            `🔗 <a href="${adminLink}">Åbn i admin →</a>`,
            ``,
            `<i>Audit-routine (CCR) er deaktiveret — egress blokerede Telegram + Supabase. Audit manuelt i Claude Code CLI når du har tid.</i>`,
          ].join("\n");
        }

        try {
          const tgResp = await fetch(
            `https://api.telegram.org/bot${tgToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: tgChatId,
                parse_mode: "HTML",
                disable_web_page_preview: true,
                text: tgText,
              }),
            },
          );
          if (!tgResp.ok) {
            const tgBody = (await tgResp.text()).slice(0, 200);
            console.error("Telegram send failed:", tgResp.status, tgBody);
            telegramStatus = `http_${tgResp.status}: ${tgBody}`;
          } else {
            console.log(`Telegram ping sent for audit_run: ${data.status}`);
            telegramStatus = "ok";
          }
        } catch (tgErr: any) {
          console.error("Telegram send threw:", tgErr);
          telegramStatus = `threw: ${tgErr?.message ?? String(tgErr)}`;
        }
      } else {
        console.log("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing — skipping Telegram ping");
        telegramStatus = "skipped: missing env";
      }
    }

    return new Response(JSON.stringify({ success: true, telegram_status: telegramStatus }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-signup-notification:", error);
    return new Response(
      JSON.stringify({ error: "Notification failed", code: "NOTIFICATION_ERROR" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
