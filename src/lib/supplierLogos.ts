// Local supplier logo mapping
// Only the top 35 most well-known suppliers have logos displayed
// All others fall back to initials

import prototalLogo from '@/assets/supplier-logos/prototal.png';
import print3dDanmarkLogo from '@/assets/supplier-logos/3d-print-danmark.png';
import fitColorLogo from '@/assets/supplier-logos/fit-color.png';
import igusOrangeLogo from '@/assets/supplier-logos/igus-orange.png';
import dtiColorLogo from '@/assets/supplier-logos/danish-technological-institute-color.png';
import t3tAdditiveBlackLogo from '@/assets/supplier-logos/3t-additive-black.png';
import sintaviaLogo from '@/assets/supplier-logos/sintavia.avif';
import threeErpLogo from '@/assets/supplier-logos/3erp.png';
import addmanLogo from '@/assets/supplier-logos/addman.png';
import beamitLogo from '@/assets/supplier-logos/beamit.png';
import burloakLogo from '@/assets/supplier-logos/burloak.png';
import craftcloudLogo from '@/assets/supplier-logos/craftcloud.png';
import facfoxLogo from '@/assets/supplier-logos/facfox.png';
import fictivLogo from '@/assets/supplier-logos/fictiv.png';
import gknPowderLogo from '@/assets/supplier-logos/gkn-powder.png';
import jawstecLogo from '@/assets/supplier-logos/jawstec.png';
import jlc3dpLogo from '@/assets/supplier-logos/jlc3dp.png';
import makerverseLogo from '@/assets/supplier-logos/makerverse.png';
import markforgedLogo from '@/assets/supplier-logos/markforged.png';
import materialiseLogo from '@/assets/supplier-logos/materialise.png';
import protiqLogo from '@/assets/supplier-logos/protiq.png';
import protolabsLogo from '@/assets/supplier-logos/protolabs.png';
import quickpartsLogo from '@/assets/supplier-logos/quickparts.png';
import rapidDirectLogo from '@/assets/supplier-logos/rapid-direct.png';
import sculpteoLogo from '@/assets/supplier-logos/sculpteo.png';
import stratasysLogo from '@/assets/supplier-logos/stratasys.png';
import weergLogo from '@/assets/supplier-logos/weerg.png';
import printuk3dLogo from '@/assets/supplier-logos/3dprintuk.png';
import fathomLogo from '@/assets/supplier-logos/fathom.png';
import imaterialiseLogo from '@/assets/supplier-logos/imaterialise.png';
import repliqueLogo from '@/assets/supplier-logos/replique.png';
import treatstockLogo from '@/assets/supplier-logos/treatstock.png';
import mx3dLogo from '@/assets/supplier-logos/mx3d.png';
import oceanzLogo from '@/assets/supplier-logos/oceanz.png';
import forecast3dDarkLogo from '@/assets/supplier-logos/forecast3d-dark.png';

// Logo mapping object - Top 35 most well-known suppliers only
export const supplierLogoMap: Record<string, string> = {
  // Danish suppliers
  'prototal': prototalLogo,
  'prototal industries': prototalLogo,
  '3d print danmark': print3dDanmarkLogo,
  '3d-print-danmark': print3dDanmarkLogo,
  'fit production': fitColorLogo,
  'fit ag': fitColorLogo,
  'danish technological institute': dtiColorLogo,
  'teknologisk institut': dtiColorLogo,

  // Major international suppliers
  'protolabs': protolabsLogo,
  'materialise': materialiseLogo,
  'stratasys': stratasysLogo,
  'stratasys direct': stratasysLogo,
  'sculpteo': sculpteoLogo,
  'i.materialise': imaterialiseLogo,
  'imaterialise': imaterialiseLogo,
  'fictiv': fictivLogo,
  'markforged': markforgedLogo,
  'weerg': weergLogo,
  'jlc3dp': jlc3dpLogo,
  'jlcpcb': jlc3dpLogo,
  'quickparts': quickpartsLogo,
  '3erp': threeErpLogo,
  'rapid direct': rapidDirectLogo,
  'facfox': facfoxLogo,
  'treatstock': treatstockLogo,
  'beamit': beamitLogo,
  'gkn powder': gknPowderLogo,
  'gkn additive': gknPowderLogo,
  'sintavia': sintaviaLogo,
  '3dprintuk': printuk3dLogo,
  '3dprint-uk': printuk3dLogo,
  'fathom': fathomLogo,
  'fathom manufacturing': fathomLogo,
  'replique': repliqueLogo,
  'igus': igusOrangeLogo,
  'protiq': protiqLogo,
  'makerverse': makerverseLogo,
  'jawstec': jawstecLogo,
  'oceanz': oceanzLogo,
  'craftcloud': craftcloudLogo,
  'burloak': burloakLogo,
  '3t additive': t3tAdditiveBlackLogo,
  '3t-additive': t3tAdditiveBlackLogo,
  'forecast3d': forecast3dDarkLogo,
  'forecast 3d': forecast3dDarkLogo,
  'addman': addmanLogo,
  'mx3d': mx3dLogo,
};

/**
 * Get local logo for a supplier by name
 * Returns undefined if no local logo is found
 */
const excludeFromLogoMatching = [
  'think3d', // Contains "k3d" but is a different company
];

export const getLocalLogoForSupplier = (supplierName: string): string | undefined => {
  const normalizedName = supplierName.toLowerCase().trim();
  
  // Check exclusion list first
  if (excludeFromLogoMatching.some(excluded => normalizedName.includes(excluded))) {
    return undefined;
  }
  
  // Direct match (highest priority)
  if (supplierLogoMap[normalizedName]) {
    return supplierLogoMap[normalizedName];
  }
  
  // Try exact word boundary matches
  const sortedKeys = Object.keys(supplierLogoMap).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const wordBoundaryPattern = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordBoundaryPattern.test(supplierName.toLowerCase())) {
      return supplierLogoMap[key];
    }
  }
  
  // Substring matches (lower priority)
  for (const key of sortedKeys) {
    if (normalizedName.includes(key)) {
      return supplierLogoMap[key];
    }
  }
  
  return undefined;
};
