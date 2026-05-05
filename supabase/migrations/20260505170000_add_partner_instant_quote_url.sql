-- Phase 7: enable per-partner direct-quote CTA.
-- Stores the partner's own instant-quote portal URL on the supplier row so the
-- frontend can render a "Get instant quote" button instead of a Craftcloud
-- mediated price.

UPDATE public.suppliers
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'instant_quote_url', 'https://app.digifabster.com/AMPrintservice/',
      'instant_quote_provider', 'digifabster'
    )
WHERE supplier_id = 'am-printservice';
