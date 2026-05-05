-- Adds the `is_partner` tier column for paying SupplyCheck partners.
-- Paying clients are pinned to the top of every supplier ranking
-- (search, /suppliers/<category>, /compare-prices, /stl-match)
-- ahead of Craftcloud / Treatstock API rows and market-price-only fallbacks.

ALTER TABLE public.suppliers
  ADD COLUMN is_partner BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_suppliers_is_partner
  ON public.suppliers (is_partner)
  WHERE is_partner = TRUE;

COMMENT ON COLUMN public.suppliers.is_partner IS
  'True for paying partner clients. Pinned to top of all rankings.';
