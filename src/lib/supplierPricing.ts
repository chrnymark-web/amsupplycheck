// Supplier pricing utilities based on technology price index
import { technologyPriceIndex, getPriceTier } from './technologyMaterialCompatibility';

export interface PriceTierInfo {
  label: string;
  symbol: string;
  color: string;
  tooltip: string;
  avgIndex: number;
}

/**
 * Calculate supplier price tier based on their technologies
 * Returns a relative price indication (€ to €€€€) with semantic colors
 */
export function getSupplierPriceTier(technologies: string[]): PriceTierInfo {
  if (!technologies || technologies.length === 0) {
    return {
      label: 'Unknown',
      symbol: '?',
      color: 'text-muted-foreground',
      tooltip: 'Price index not available',
      avgIndex: 0
    };
  }

  // Map technology keys to price indices
  // Handle both display names and database keys
  const technologyKeyMap: Record<string, string> = {
    'fdm': 'FDM/FFF',
    'sla': 'SLA',
    'dlp': 'DLP',
    'cdlp': 'CDLP (Continuous Digital Light Processing)',
    'sls': 'SLS',
    'mjf': 'Multi Jet Fusion',
    'saf': 'SAF',
    'dmls': 'DMLS',
    'slm': 'SLM',
    'dmp': 'Direct Metal Printing',
    'material-jetting': 'Material Jetting',
    'binder-jetting': 'Binder Jetting',
  };

  const prices = technologies
    .map(tech => {
      // Try direct lookup first
      if (technologyPriceIndex[tech]) {
        return technologyPriceIndex[tech];
      }
      // Try mapped key
      const mappedKey = technologyKeyMap[tech.toLowerCase()];
      if (mappedKey && technologyPriceIndex[mappedKey]) {
        return technologyPriceIndex[mappedKey];
      }
      // Default to medium cost
      return 2.0;
    })
    .filter(p => p > 0);

  if (prices.length === 0) {
    return {
      label: 'Unknown',
      symbol: '?',
      color: 'text-muted-foreground',
      tooltip: 'Price index not available',
      avgIndex: 0
    };
  }

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const tier = getPriceTier(avgPrice);

  // Semantic colors for price tiers
  const colors: Record<string, string> = {
    '€': 'text-green-600 dark:text-green-500',
    '€€': 'text-yellow-600 dark:text-yellow-500',
    '€€€': 'text-orange-600 dark:text-orange-500',
    '€€€€': 'text-red-600 dark:text-red-500',
  };

  return {
    ...tier,
    color: colors[tier.symbol] || 'text-muted-foreground',
    tooltip: `Based on ${technologies.length} technolog${technologies.length > 1 ? 'ies' : 'y'}`,
    avgIndex: avgPrice
  };
}

/**
 * Get a short description for the price tier
 */
export function getPriceTierDescription(symbol: string): string {
  const descriptions: Record<string, string> = {
    '€': 'Budget-friendly option for prototyping and simple parts',
    '€€': 'Balanced cost for functional prototypes and production',
    '€€€': 'Higher investment for engineering-grade parts',
    '€€€€': 'Premium pricing for aerospace/medical grade components',
  };
  return descriptions[symbol] || 'Price varies based on specifications';
}
