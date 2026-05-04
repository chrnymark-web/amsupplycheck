// Google Analytics tracking via GTM dataLayer
// This file provides a centralized way to track events across the application
// All events are pushed to dataLayer and picked up by Google Tag Manager.
// High-signal events are ALSO written to Supabase analytics_events for the
// admin funnel — that table is the source of truth, GA4 is for marketing.
import { supabase } from '@/integrations/supabase/client';

// Enable debug mode to see detailed tracking information
export const GA_DEBUG_MODE = localStorage.getItem('ga_debug') === 'true';

// Events that are also persisted to Supabase analytics_events.
// Keep this list tight — only events that drive the admin funnel and product analytics.
const HIGH_SIGNAL_EVENTS = new Set<string>([
  'page_view',
  'supplier_pageview',
  'outbound_click',
  'search',
  'cta_click',
  'newsletter_signup_submit',
  'quote_request_submit',
  'select_item',
]);

const SESSION_ID_KEY = 'sc_analytics_session_id';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = (window.crypto && 'randomUUID' in window.crypto)
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, any>>;
    gaDebugEvents?: Array<{
      timestamp: string;
      eventName: string;
      params: EventParams;
      success: boolean;
    }>;
  }
}

interface EventParams {
  [key: string]: string | number | boolean;
}

// UTM parameter keys to capture
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as const;
const UTM_STORAGE_KEY = 'sc_utm_params';

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

/**
 * Capture UTM parameters from URL and store in sessionStorage
 * Should be called once on page load
 */
export function captureUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const storedParams = getStoredUTMParams();
  
  // Check if URL has any UTM params
  const hasNewUTMParams = UTM_PARAMS.some(param => urlParams.has(param));
  
  if (hasNewUTMParams) {
    const newParams: UTMParams = {
      landing_page: window.location.pathname,
      referrer: document.referrer || undefined,
      captured_at: new Date().toISOString(),
    };
    
    UTM_PARAMS.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        newParams[param] = value;
      }
    });
    
    // Store in sessionStorage (persists for session)
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(newParams));
    } catch (e) {
      console.warn('Failed to store UTM params:', e);
    }
    
    if (GA_DEBUG_MODE) {
      console.group('🏷️ UTM Parameters Captured');
      console.table(newParams);
      console.groupEnd();
    }
    
    return newParams;
  }
  
  return storedParams;
}

/**
 * Get stored UTM parameters from sessionStorage
 */
export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Get UTM params formatted for GTM events
 */
function getUTMParamsForEvent(): Record<string, string> {
  const params = getStoredUTMParams();
  const eventParams: Record<string, string> = {};
  
  if (params.utm_source) eventParams.campaign_source = params.utm_source;
  if (params.utm_medium) eventParams.campaign_medium = params.utm_medium;
  if (params.utm_campaign) eventParams.campaign_name = params.utm_campaign;
  if (params.utm_term) eventParams.campaign_term = params.utm_term;
  if (params.utm_content) eventParams.campaign_content = params.utm_content;
  if (params.gclid) eventParams.gclid = params.gclid;
  if (params.fbclid) eventParams.fbclid = params.fbclid;
  if (params.landing_page) eventParams.landing_page = params.landing_page;
  
  return eventParams;
}

// Initialize debug events storage
if (typeof window !== 'undefined' && !window.gaDebugEvents) {
  window.gaDebugEvents = [];
}

// Auto-capture UTM params on load
if (typeof window !== 'undefined') {
  captureUTMParams();
}

/**
 * Track a custom event via GTM dataLayer
 * @param eventName - The name of the event (e.g., 'supplier_click', 'newsletter_signup')
 * @param params - Additional parameters to send with the event
 */
export const trackEvent = (eventName: string, params?: EventParams): void => {
  const timestamp = new Date().toISOString();
  
  // Get UTM params to include with every event
  const utmParams = getUTMParamsForEvent();
  
  // Enrich params with source fallback and UTM data for consistent funnel tracking
  const enrichedParams: EventParams = {
    ...utmParams,
    ...params,
    // Always include source for funnel attribution - default to 'direct'
    source: params?.source || 'direct',
  };
  
  const debugInfo = {
    timestamp,
    eventName,
    params: enrichedParams,
    success: false,
  };

  if (HIGH_SIGNAL_EVENTS.has(eventName) && typeof window !== 'undefined') {
    void supabase.from('analytics_events').insert({
      event_name: eventName,
      props: enrichedParams as Record<string, unknown>,
      session_id: getSessionId(),
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  }

  try {
    if (typeof window !== 'undefined' && window.dataLayer) {
      // Push event to GTM dataLayer
      window.dataLayer.push({
        event: eventName,
        ...enrichedParams,
      });
      debugInfo.success = true;
      
      // Store event for debug panel
      if (window.gaDebugEvents) {
        window.gaDebugEvents.unshift(debugInfo);
        // Keep only last 50 events
        if (window.gaDebugEvents.length > 50) {
          window.gaDebugEvents.pop();
        }
      }

      if (GA_DEBUG_MODE) {
        console.group(`🎯 GTM Event: ${eventName}`);
        console.log('Timestamp:', timestamp);
        console.log('Event Name:', eventName);
        console.table(enrichedParams);
        console.log('Custom Dimensions:', extractCustomDimensions(enrichedParams));
        console.groupEnd();
      } else {
        console.log('GTM Event tracked:', eventName, enrichedParams);
      }
    } else {
      console.warn('⚠️ GTM dataLayer not loaded');
      if (GA_DEBUG_MODE) {
        console.group('❌ GTM Event Failed');
        console.log('Event Name:', eventName);
        console.log('Params:', enrichedParams);
        console.log('Reason: dataLayer not available');
        console.groupEnd();
      }
    }
  } catch (error) {
    console.error('❌ Error tracking event:', error);
    if (GA_DEBUG_MODE) {
      console.group('❌ GTM Error Details');
      console.log('Event Name:', eventName);
      console.log('Params:', enrichedParams);
      console.error('Error:', error);
      console.groupEnd();
    }
  }
};

/**
 * Extract custom dimensions from event parameters
 */
const extractCustomDimensions = (params?: EventParams): Record<string, any> => {
  if (!params) return {};
  
  const dimensions: Record<string, any> = {};
  const customDimensionKeys = [
    'active_filters_count',
    'result_count',
    'verified',
    'interaction_source',
    'search_type',
    'scroll_depth',
    'page_section',
    'supplier_id',
    'map_action',
    'supplier_name',
    'link_domain',
    'source',
    // UTM/Campaign dimensions
    'campaign_source',
    'campaign_medium',
    'campaign_name',
    'campaign_term',
    'campaign_content',
    'gclid',
    'fbclid',
    'landing_page',
  ];

  customDimensionKeys.forEach(key => {
    if (params[key] !== undefined) {
      dimensions[key] = params[key];
    }
  });

  return dimensions;
};

/**
 * Track conversion events (form submissions, signups, etc.)
 */
export const trackConversion = (
  conversionType: 'supplier_application' | 'newsletter_signup' | 'supplier_website_click',
  value?: string | number
): void => {
  trackEvent(`${conversionType}_submit`, {
    conversion_type: conversionType,
    ...(value && { value: String(value) }),
    timestamp: Date.now(),
  });
};

/**
 * Track user engagement events (clicks, interactions, etc.)
 */
export const trackEngagement = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  trackEvent('engagement', {
    event_category: category,
    event_action: action,
    ...(label && { event_label: label }),
    ...(value !== undefined && { value }),
  });
};

/**
 * Track outbound link clicks (supplier website visits)
 */
export const trackOutboundLink = (
  url: string,
  supplierName?: string,
  supplierId?: string
): void => {
  // Track as conversion - this is what we consider a conversion
  trackConversion('supplier_website_click', 1);
  
  // Also track the outbound click with details
  trackEvent('outbound_click', {
    link_url: url,
    link_domain: new URL(url).hostname,
    ...(supplierName && { supplier_name: supplierName }),
    ...(supplierId && { supplier_id: supplierId }),
  });
};

/**
 * Track search and filter usage
 */
export const trackSearch = (
  filterType: 'material' | 'technology' | 'area' | 'search',
  filterValue: string,
  resultCount: number,
  activeFiltersCount: number
): void => {
  trackEvent('search', {
    search_type: filterType,
    search_term: filterValue,
    result_count: resultCount,
    active_filters_count: activeFiltersCount,
  });
};

/**
 * Track supplier interactions
 */
export const trackSupplierInteraction = (
  action: 'click' | 'view' | 'contact',
  supplierId: string,
  supplierName: string,
  source: 'map' | 'card' | 'detail',
  metadata?: Record<string, any>
): void => {
  trackEvent('supplier_interaction', {
    interaction_action: action,
    supplier_id: supplierId,
    supplier_name: supplierName,
    interaction_source: source,
    ...metadata,
  });
};

/**
 * Track map interactions
 */
export const trackMapInteraction = (
  action: 'zoom' | 'pan' | 'marker_click' | 'bounds_change',
  metadata?: Record<string, any>
): void => {
  trackEvent('map_interaction', {
    map_action: action,
    ...metadata,
  });
};

/**
 * Track CTA button clicks
 */
export const trackCTAClick = (
  buttonText: string,
  section: string,
  destination?: string
): void => {
  trackEvent('cta_click', {
    button_text: buttonText,
    page_section: section,
    ...(destination && { destination }),
  });
};

/**
 * Track scroll depth milestones
 */
export const trackScrollDepth = (
  depth: 25 | 50 | 75 | 90 | 100,
  section?: string
): void => {
  trackEvent('scroll', {
    scroll_depth: depth,
    ...(section && { page_section: section }),
  });
};

/**
 * GA4 Enhanced Ecommerce Item structure
 */
export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_brand?: string;
  item_list_name?: string;
  index?: number;
  price?: number;
  quantity?: number;
}

/**
 * Funnel Session for tracking user journey
 */
interface FunnelSession {
  sessionId: string;
  startTime: number;
  searchEvents: number;
  viewedSuppliers: string[];
  contactedSuppliers: string[];
  convertedSuppliers: string[];
}

// Initialize funnel session
let currentFunnelSession: FunnelSession = {
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  startTime: Date.now(),
  searchEvents: 0,
  viewedSuppliers: [],
  contactedSuppliers: [],
  convertedSuppliers: [],
};

/**
 * Get or create funnel session
 */
const getFunnelSession = (): FunnelSession => {
  // Reset session if older than 30 minutes
  if (Date.now() - currentFunnelSession.startTime > 30 * 60 * 1000) {
    currentFunnelSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      searchEvents: 0,
      viewedSuppliers: [],
      contactedSuppliers: [],
      convertedSuppliers: [],
    };
  }
  return currentFunnelSession;
};

/**
 * Track view_item_list event (GA4 Enhanced Ecommerce)
 */
export const trackViewItemList = (
  items: GA4Item[],
  listName: string,
  filterState?: {
    materials?: string[];
    technologies?: string[];
    areas?: string[];
    searchQuery?: string;
  },
  source: 'search' | 'map' | 'direct' = 'search'
): void => {
  const session = getFunnelSession();
  session.searchEvents++;

  trackEvent('view_item_list', {
    item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
    item_list_name: listName,
    items: JSON.stringify(items.slice(0, 10)), // Send first 10 items
    value: items.length,
    source, // Consistent source parameter for funnel tracking
    ...(filterState?.materials?.length && { filter_materials: filterState.materials.join(',') }),
    ...(filterState?.technologies?.length && { filter_technologies: filterState.technologies.join(',') }),
    ...(filterState?.areas?.length && { filter_areas: filterState.areas.join(',') }),
    ...(filterState?.searchQuery && { search_query: filterState.searchQuery }),
    session_id: session.sessionId,
    search_event_count: session.searchEvents,
  });
};

/**
 * Track select_item event (GA4 Enhanced Ecommerce)
 */
export const trackSelectItem = (
  item: GA4Item,
  listName: string,
  index: number,
  source: 'search' | 'map' | 'direct' = 'search'
): void => {
  trackEvent('select_item', {
    item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
    item_list_name: listName,
    items: JSON.stringify([{ ...item, index }]),
    index,
    source, // Consistent source parameter for funnel tracking
    session_id: getFunnelSession().sessionId,
  });
};

/**
 * Track view_item event (GA4 Enhanced Ecommerce)
 */
export const trackViewItem = (
  item: GA4Item,
  source: 'direct' | 'search' | 'map' = 'direct'
): void => {
  const session = getFunnelSession();
  
  // Add to viewed suppliers if not already there
  if (!session.viewedSuppliers.includes(item.item_id)) {
    session.viewedSuppliers.push(item.item_id);
  }

  trackEvent('view_item', {
    items: JSON.stringify([item]),
    value: item.price || 0,
    source, // Consistent source parameter for funnel tracking
    session_id: session.sessionId,
    viewed_suppliers_count: session.viewedSuppliers.length,
  });
};

/**
 * Track add_to_cart event (represents contact intent)
 */
export const trackAddToCart = (
  item: GA4Item,
  source: 'card' | 'detail'
): void => {
  const session = getFunnelSession();
  
  // Add to contacted suppliers if not already there
  if (!session.contactedSuppliers.includes(item.item_id)) {
    session.contactedSuppliers.push(item.item_id);
  }

  trackEvent('add_to_cart', {
    items: JSON.stringify([{ ...item, quantity: 1 }]),
    value: item.price || 1,
    contact_source: source,
    session_id: session.sessionId,
    contacted_suppliers_count: session.contactedSuppliers.length,
  });
};

/**
 * Track purchase event (represents actual conversion - website visit)
 */
export const trackPurchase = (
  item: GA4Item,
  transactionId: string,
  source?: 'direct' | 'search' | 'map'
): void => {
  const session = getFunnelSession();
  
  // Add to converted suppliers if not already there
  if (!session.convertedSuppliers.includes(item.item_id)) {
    session.convertedSuppliers.push(item.item_id);
  }

  trackEvent('purchase', {
    transaction_id: transactionId,
    value: item.price || 1,
    currency: 'USD',
    items: JSON.stringify([{ ...item, quantity: 1 }]),
    ...(source && { source }), // Consistent source parameter for funnel tracking
    session_id: session.sessionId,
    converted_suppliers_count: session.convertedSuppliers.length,
    funnel_completion_rate: (session.convertedSuppliers.length / Math.max(session.viewedSuppliers.length, 1) * 100).toFixed(2),
  });
};

/**
 * Track filter_applied event
 */
export const trackFilterApplied = (
  filterType: 'material' | 'technology' | 'area' | 'search' | 'all',
  filterValue: string[],
  previousCount: number,
  newCount: number
): void => {
  trackEvent('filter_applied', {
    filter_type: filterType,
    filter_value: filterValue.join(','),
    previous_result_count: previousCount,
    new_result_count: newCount,
    result_change: newCount - previousCount,
    session_id: getFunnelSession().sessionId,
  });
};

/**
 * Track supplier impressions (when they come into view)
 */
export const trackSupplierImpression = (
  items: GA4Item[],
  listName: string
): void => {
  trackEvent('view_item_list_impression', {
    item_list_name: listName,
    items: JSON.stringify(items),
    impression_count: items.length,
    session_id: getFunnelSession().sessionId,
  });
};

/**
 * Convert supplier data to GA4Item format
 */
export const supplierToGA4Item = (
  supplier: {
    id: string;
    name: string;
    technologies?: string[];
    materials?: string[];
    region?: string;
    premium?: boolean;
  },
  index?: number
): GA4Item => {
  return {
    item_id: supplier.id,
    item_name: supplier.name,
    item_category: supplier.technologies?.[0] || 'general',
    item_category2: supplier.materials?.[0] || 'various',
    item_category3: supplier.region || 'global',
    item_brand: supplier.name,
    index,
    price: supplier.premium ? 2 : 1, // Use for prioritization
  };
};
