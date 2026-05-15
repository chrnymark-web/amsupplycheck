// Shared types for pricing — both live API quotes and market-data estimates

export type Currency = 'EUR' | 'USD' | 'GBP' | 'DKK';

export interface QuoteSanityResult {
  flag: 'ok' | 'suspect-low' | 'suspect-high';
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  userMessage?: string;
}

export interface QuoteGeometry {
  volumeCm3: number;
  boundingBox: { x: number; y: number; z: number };
  triangleCount: number;
}

export type PriceSource = 'craftcloud' | 'treatstock';

// A single material/finish option from a vendor
export interface QuoteOption {
  material: string;
  materialConfigId?: string;
  technology?: string;
  label?: string;           // e.g. "Fastest delivery", "Alternative material"
  unitPrice: number;
  totalPrice: number;
  estimatedLeadTimeDays: number | null;
  shippingEstimate: number | null;
}

// A real-time quote from a supplier API
export interface LiveQuote {
  type: 'live';
  supplierId: string;
  supplierName: string;
  supplierLogo?: string;
  material: string;
  materialConfigId?: string;
  technology: string;
  technologyConfidence?: 'exact' | 'heuristic' | 'unknown';
  unitPrice: number;
  totalPrice: number;
  currency: Currency;
  quantity: number;
  estimatedLeadTimeDays: number | null;
  shippingEstimate: number | null;
  quoteUrl: string | null;
  fetchedAt: Date;
  source: PriceSource;
  alternativeQuotes?: QuoteOption[];
  sanityResult?: QuoteSanityResult;
  /** Continent the supplier is headquartered in, e.g. 'Europe'. Undefined if unknown. */
  supplierArea?: string;
}

// An estimated price based on market data / technology index
export interface EstimatedPrice {
  type: 'estimated';
  supplierId: string;
  supplierName: string;
  supplierLogo?: string;
  isPartner?: boolean;      // True if paying SupplyCheck partner — pinned to top
  priceTier: string;        // '€' | '€€' | '€€€' | '€€€€'
  priceTierLabel: string;   // 'Low cost' | 'Medium cost' | etc
  priceRangeLow: number;    // Estimated low price in EUR
  priceRangeHigh: number;   // Estimated high price in EUR
  currency: Currency;
  basedOn: string;          // e.g. "SLS, MJF technologies"
}

// Union type for any price display
export type SupplierPrice = LiveQuote | EstimatedPrice;

export interface QuoteRequest {
  file: File;
  quantity: number;
  material?: string;
  technology?: string;
  currency?: Currency;
  countryCode?: string;
  geometry?: QuoteGeometry;
}

export interface QuoteResult {
  supplier: string;
  source: PriceSource;
  quotes: LiveQuote[];
  error?: string;
}

// Suppliers that have working APIs
export const LIVE_PRICE_SUPPLIERS: PriceSource[] = ['craftcloud', 'treatstock'];
