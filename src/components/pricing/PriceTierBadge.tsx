import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign } from 'lucide-react';
import { getSupplierPriceTier, getPriceTierDescription } from '@/lib/supplierPricing';
import { cn } from '@/lib/utils';

interface PriceTierBadgeProps {
  technologies: string[];
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriceTierBadge: React.FC<PriceTierBadgeProps> = ({
  technologies,
  showLabel = false,
  size = 'sm',
  className
}) => {
  const tier = getSupplierPriceTier(technologies);

  if (tier.symbol === '?') {
    return null; // Don't show if no pricing data available
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          'flex items-center gap-1 cursor-help',
          textSize,
          className
        )}>
          <DollarSign className={cn(iconSize, tier.color)} />
          <span className={cn('font-medium', tier.color)}>{tier.symbol}</span>
          {showLabel && (
            <span className="text-muted-foreground ml-0.5">{tier.label}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{tier.label}</p>
          <p className="text-xs text-muted-foreground">{getPriceTierDescription(tier.symbol)}</p>
          <p className="text-xs text-muted-foreground">{tier.tooltip}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default PriceTierBadge;
