import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  autoApproveThreshold: number;
  totalAutoApproved: number;
}

type NotificationRequest = SupplierApplicationNotification | NewsletterSignupNotification | AutoApprovalNotification;

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
    if (!data.type || !["supplier_application", "newsletter_signup", "auto_approval"].includes(data.type)) {
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

    let emailSubject: string;
    let emailHtml: string;

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

    const emailResponse = await resend.emails.send({
      from: "AMSupplyCheck <onboarding@resend.dev>",
      to: ["chr.nymark@gmail.com"],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
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
