-- Fix Aectual location data to match aectual.com
-- Source: https://www.aectual.com/contact (verified 2026-04-26)
-- Coordinates from OpenStreetMap Nominatim geocoding of the published address.
UPDATE public.suppliers
SET
  location_address = 'H.J.E. Wenckebachweg 48, 1096 AN Amsterdam',
  location_lat = 52.3371354,
  location_lng = 4.9251157,
  updated_at = now()
WHERE supplier_id = 'aectual';
