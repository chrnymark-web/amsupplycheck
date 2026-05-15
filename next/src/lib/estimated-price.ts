import type { EstimatedPrice, QuoteGeometry } from "@/lib/quote-types";
import {
  getPriceTier,
  materialPriceIndex,
  technologyPriceIndex,
} from "@/lib/technologyMaterialCompatibility";
import { normalizeTechKey } from "@/lib/materialTechClassifier";

const BASE_EUR_PER_CM3 = 0.35;
const FIXED_SETUP_EUR = 6.0;
const BBOX_SURCHARGE_PER_CM = 0.15;
const MIN_UNIT_EUR = 3.5;
const MAX_UNIT_EUR = 3000;
const RANGE_SPREAD = 0.35;

export interface EstimatePriceInput {
  supplierName: string;
  supplierId: string;
  supplierTechnologies: string[];
  selectedTechnology?: string;
  selectedMaterial?: string;
  geometry?: QuoteGeometry;
  quantity?: number;
  logoUrl?: string;
  isPartner?: boolean;
}

export function getEstimatedPrice(input: EstimatePriceInput): EstimatedPrice {
  const {
    supplierName,
    supplierId,
    supplierTechnologies,
    selectedTechnology,
    selectedMaterial,
    geometry,
    quantity = 1,
    logoUrl,
    isPartner,
  } = input;

  const techKeys = selectedTechnology
    ? [normalizeTechKey(selectedTechnology)].filter(Boolean)
    : supplierTechnologies.map(normalizeTechKey).filter(Boolean);

  const techIndex = techKeys.length > 0
    ? Math.min(...techKeys.map((k) => technologyPriceIndex[k] ?? 2.0))
    : 2.0;
  const cheapestTechKey = !selectedTechnology && techKeys.length > 0
    ? techKeys.reduce((best, k) =>
        (technologyPriceIndex[k] ?? 2.0) < (technologyPriceIndex[best] ?? 2.0) ? k : best
      )
    : null;

  const matIndex = selectedMaterial && materialPriceIndex[selectedMaterial]
    ? materialPriceIndex[selectedMaterial]
    : 1.0;

  let central: number;
  if (geometry && geometry.volumeCm3 > 0) {
    const { volumeCm3, boundingBox } = geometry;
    const maxDimCm = Math.max(boundingBox.x, boundingBox.y, boundingBox.z) / 10;
    central =
      FIXED_SETUP_EUR +
      volumeCm3 * BASE_EUR_PER_CM3 * techIndex * matIndex +
      Math.max(0, maxDimCm - 10) * BBOX_SURCHARGE_PER_CM;
  } else {
    central = FIXED_SETUP_EUR + 12 * techIndex * matIndex;
  }
  central = Math.max(MIN_UNIT_EUR, Math.min(MAX_UNIT_EUR, central));

  const tier = getPriceTier(techIndex * matIndex);

  const basedOn = selectedTechnology
    ? `${selectedTechnology}${selectedMaterial ? ' · ' + selectedMaterial : ''}${geometry ? ' · geometry' : ''}`
    : cheapestTechKey
      ? `${cheapestTechKey} (cheapest of ${techKeys.length} tech${techKeys.length === 1 ? '' : 's'})${geometry ? ' · geometry' : ''}`
      : 'Market data';

  return {
    type: 'estimated',
    supplierId,
    supplierName,
    supplierLogo: logoUrl,
    isPartner: isPartner || false,
    priceTier: tier.symbol,
    priceTierLabel: tier.label,
    priceRangeLow: Math.round(central * (1 - RANGE_SPREAD)) * quantity,
    priceRangeHigh: Math.round(central * (1 + RANGE_SPREAD)) * quantity,
    currency: 'EUR',
    basedOn,
  };
}
