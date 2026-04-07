import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SupplierLogo from '@/components/ui/supplier-logo';
import { MapPin, Verified, ExternalLink, Crown, Clock } from 'lucide-react';
import { getDisplayNameFromMaterialKey, getDisplayNameFromTechnologyKey } from '@/lib/supplierData';
import { trackSupplierInteraction, trackOutboundLink, trackSelectItem, supplierToGA4Item, trackSupplierImpression } from '@/lib/analytics';
import { TechInfoBadge } from '@/components/comparison/TechnologyTooltip';

import { LeadTimeBadge } from '@/components/pricing/LeadTimeBadge';
import { TooltipProvider } from '@/components/ui/tooltip';

interface Supplier {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
  };
  technologies: string[];
  materials: string[];
  verified: boolean;
  premium: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  website?: string;
  logoUrl?: string;
  leadTime?: string | null;
  hasRushService?: boolean;
  hasInstantQuote?: boolean;
}

interface LiveQuoteInfo {
  unitPrice: number;
  currency: string;
  estimatedLeadTimeDays: number | null;
  material: string;
}

interface SupplierCardProps {
  supplier: Supplier;
  className?: string;
  index?: number;
  listName?: string;
  matchedRequirements?: string[];
  liveQuote?: LiveQuoteInfo;
}

const REQUIREMENT_ICONS: Record<string, string> = {
  'High strength': '💪',
  'High precision': '🎯',
  'Heat resistant': '🔥',
  'Chemical resistant': '🧪',
  'Flexible/Elastic': '🔄',
  'Biocompatible': '🧬',
  'Food-grade': '🍽️',
  'Cosmetic finish': '✨',
  'Outdoor/UV resistant': '☀️',
  'Low cost': '💰',
};

const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  className = "",
  index = 0,
  listName = "Search Results",
  matchedRequirements = [],
  liveQuote
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [hasBeenViewed, setHasBeenViewed] = React.useState(false);
  // Track impression when card comes into viewport
  React.useEffect(() => {
    if (!cardRef.current || hasBeenViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed) {
            setHasBeenViewed(true);
            const ga4Item = supplierToGA4Item(supplier, index);
            trackSupplierImpression([ga4Item], listName);
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% visible
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [supplier, index, listName, hasBeenViewed]);

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (supplier.website) {
      // Track outbound link click
      trackOutboundLink(supplier.website, supplier.name, supplier.id);
      trackSupplierInteraction('contact', supplier.id, supplier.name, 'card', {
        verified: supplier.verified,
        premium: supplier.premium,
      });
    }
  };

  const handleCardClick = () => {
    // Track GA4 select_item event
    const ga4Item = supplierToGA4Item(supplier, index);
    trackSelectItem(ga4Item, listName, index);

    // Track supplier card click
    trackSupplierInteraction('click', supplier.id, supplier.name, 'card', {
      verified: supplier.verified,
      premium: supplier.premium,
      technologies_count: supplier.technologies.length,
      materials_count: supplier.materials.length,
      list_position: index,
    });
    window.location.href = `/suppliers/${supplier.id}`;
  };

  return (
    <Card 
      ref={cardRef}
      className={`bg-gradient-card border-border shadow-card hover:shadow-hover hover:scale-[1.02] transition-all duration-300 group cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-1.5 pt-3 px-3">
        <div className="flex items-start space-x-2">
          <div className="group-hover:scale-110 transition-transform duration-300">
            <SupplierLogo 
              name={supplier.name} 
              logoUrl={supplier.logoUrl}
              size="xl"
              className="flex-shrink-0"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-all duration-300 truncate">
                  {supplier.name}
                </h3>
                {supplier.verified && (
                  <Verified className="h-3 w-3 text-supplier-verified flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                )}
                {supplier.premium && (
                  <Crown className="h-3 w-3 text-supplier-premium flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                )}
              </div>
            </div>
            {supplier.location.city && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">{supplier.location.city}, {supplier.location.country}</span>
              </div>
            )}
            {liveQuote && (
              <div className="flex items-center gap-2 mt-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm font-bold text-emerald-400">
                  {liveQuote.currency === 'EUR' ? '€' : liveQuote.currency === 'USD' ? '$' : liveQuote.currency}{liveQuote.unitPrice.toFixed(2)}
                </span>
                {liveQuote.material && (
                  <span className="text-[10px] text-muted-foreground truncate">{liveQuote.material}</span>
                )}
                {liveQuote.estimatedLeadTimeDays && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                    <Clock className="h-2.5 w-2.5" />
                    {liveQuote.estimatedLeadTimeDays}d
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {supplier.technologies.slice(0, 3).map((tech, index) => (
                <TechInfoBadge 
                  key={index}
                  name={getDisplayNameFromTechnologyKey(tech)}
                  type="technology"
                  variant="secondary"
                  className="text-xs px-1.5 py-0 group-hover:scale-105 transition-transform duration-300"
                />
              ))}
              {supplier.technologies.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 group-hover:scale-105 transition-transform duration-300">
                  +{supplier.technologies.length - 3}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {supplier.materials.slice(0, 3).map((material, index) => (
                <TechInfoBadge 
                  key={index}
                  name={getDisplayNameFromMaterialKey(material)}
                  type="material"
                  variant="outline"
                  className="text-xs px-1.5 py-0 group-hover:scale-105 transition-transform duration-300"
                />
              ))}
              {supplier.materials.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 group-hover:scale-105 transition-transform duration-300">
                  +{supplier.materials.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Matched Requirements */}
      {matchedRequirements.length > 0 && (
        <div className="px-3 pb-1">
          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border/50">
            {matchedRequirements.map((req) => (
              <span
                key={req}
                className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 leading-none"
              >
                <span className="text-[10px]">{REQUIREMENT_ICONS[req] || '✓'}</span>
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lead Time Indicator */}
      {(supplier.leadTime || supplier.hasRushService || supplier.hasInstantQuote) && (
        <div className="px-3 pb-2">
          <TooltipProvider>
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <LeadTimeBadge 
                leadTime={supplier.leadTime} 
                hasRushService={supplier.hasRushService}
                hasInstantQuote={supplier.hasInstantQuote}
              />
            </div>
          </TooltipProvider>
        </div>
      )}
      
      <CardContent className="pt-2 px-3 pb-3">
        {/* Actions */}
        <div className="flex gap-2">
          {supplier.website ? (
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleContactClick}
              className="flex-[2] inline-flex items-center justify-center bg-gradient-primary text-primary-foreground hover:shadow-hover hover:scale-105 transition-all duration-300 h-7 text-xs rounded-md px-3"
            >
              Contact
              <ExternalLink className="h-2.5 w-2.5 ml-1 group-hover:translate-x-0.5 transition-transform duration-300" />
            </a>
          ) : (
            <span className="flex-[2] inline-flex items-center justify-center bg-muted text-muted-foreground h-7 text-xs rounded-md px-3 cursor-not-allowed">
              Contact
            </span>
          )}
          <Button 
            variant="outline"
            className="flex-[1] hover:bg-accent hover:scale-105 transition-all duration-300 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierCard;