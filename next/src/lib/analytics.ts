// Google Analytics tracking via GTM dataLayer.
// Ported from src/lib/analytics.ts. All browser-only side effects are gated
// by `typeof window !== 'undefined'` so this module is safe to import from
// Server Components (the functions will be no-ops on the server).

export const HIGH_SIGNAL_EVENTS = new Set<string>([
  "page_view",
  "supplier_pageview",
  "outbound_click",
  "search",
  "cta_click",
  "newsletter_signup_submit",
  "quote_request_submit",
  "select_item",
  "view_item",
  "view_item_list",
  "add_to_cart",
  "purchase",
  "filter_applied",
  "file_uploaded",
  "supplier_application_submit",
  "supplier_website_click_submit",
]);

export const EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  supplier_pageview: "Supplier page view",
  outbound_click: "Affiliate / outbound click",
  search: "Search",
  cta_click: "CTA click",
  newsletter_signup_submit: "Newsletter signup",
  quote_request_submit: "Quote request",
  select_item: "Select item",
  view_item: "View item",
  view_item_list: "View item list",
  add_to_cart: "Add to cart",
  purchase: "Purchase",
  filter_applied: "Filter applied",
  file_uploaded: "File uploaded",
  supplier_application_submit: "Supplier application submit",
  supplier_website_click_submit: "Supplier website click submit",
};

const SESSION_ID_KEY = "sc_analytics_session_id";
const UTM_STORAGE_KEY = "sc_utm_params";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

interface EventParams {
  [key: string]: string | number | boolean;
}
interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id =
        window.crypto && "randomUUID" in window.crypto
          ? window.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export function captureUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};
  const urlParams = new URLSearchParams(window.location.search);
  const storedParams = getStoredUTMParams();
  const hasNew = UTM_PARAMS.some((p) => urlParams.has(p));
  if (!hasNew) return storedParams;

  const newParams: UTMParams = {
    landing_page: window.location.pathname,
    referrer: document.referrer || undefined,
    captured_at: new Date().toISOString(),
  };
  UTM_PARAMS.forEach((p) => {
    const v = urlParams.get(p);
    if (v) (newParams as Record<string, string | undefined>)[p] = v;
  });
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(newParams));
  } catch {}
  return newParams;
}

export function getStoredUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function getUTMParamsForEvent(): Record<string, string> {
  const p = getStoredUTMParams();
  const out: Record<string, string> = {};
  if (p.utm_source) out.campaign_source = p.utm_source;
  if (p.utm_medium) out.campaign_medium = p.utm_medium;
  if (p.utm_campaign) out.campaign_name = p.utm_campaign;
  if (p.utm_term) out.campaign_term = p.utm_term;
  if (p.utm_content) out.campaign_content = p.utm_content;
  if (p.gclid) out.gclid = p.gclid;
  if (p.fbclid) out.fbclid = p.fbclid;
  if (p.landing_page) out.landing_page = p.landing_page;
  return out;
}

export const trackEvent = (eventName: string, params?: EventParams): void => {
  if (typeof window === "undefined") return;

  const utmParams = getUTMParamsForEvent();
  const enrichedParams: EventParams = {
    ...utmParams,
    ...params,
    source: params?.source || "direct",
  };

  if (HIGH_SIGNAL_EVENTS.has(eventName)) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    if (SUPABASE_URL && SUPABASE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          event_name: eventName,
          props: enrichedParams as Record<string, unknown>,
          session_id: getSessionId(),
          page_path: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        }),
      }).catch((err) => console.warn("[analytics_events] insert failed:", err));
    }
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...enrichedParams });
  } catch (error) {
    console.error("Error tracking event:", error);
  }
};

export const trackConversion = (
  conversionType: "supplier_application" | "newsletter_signup" | "supplier_website_click",
  value?: string | number,
): void => {
  trackEvent(`${conversionType}_submit`, {
    conversion_type: conversionType,
    ...(value && { value: String(value) }),
    timestamp: Date.now(),
  });
};

export const trackOutboundLink = (url: string, supplierName?: string, supplierId?: string): void => {
  trackConversion("supplier_website_click", 1);
  trackEvent("outbound_click", {
    link_url: url,
    link_domain: new URL(url).hostname,
    ...(supplierName && { supplier_name: supplierName }),
    ...(supplierId && { supplier_id: supplierId }),
  });
};

export const trackCTAClick = (buttonText: string, section: string, destination?: string): void => {
  trackEvent("cta_click", {
    button_text: buttonText,
    page_section: section,
    ...(destination && { destination }),
  });
};

export const trackScrollDepth = (
  depth: 25 | 50 | 75 | 90 | 100,
  section?: string,
): void => {
  trackEvent("scroll", {
    scroll_depth: depth,
    ...(section && { page_section: section }),
  });
};
