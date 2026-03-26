import React from 'react';
import { Clock, Zap, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LeadTimeBadgeProps {
  leadTime?: string | null;
  hasRushService?: boolean;
  hasInstantQuote?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const LeadTimeBadge: React.FC<LeadTimeBadgeProps> = ({
  leadTime,
  hasRushService,
  hasInstantQuote,
  size = 'sm',
  className
}) => {
  // Don't render if no data available
  if (!leadTime && !hasRushService && !hasInstantQuote) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  // Build tooltip content
  const tooltipParts: string[] = [];
  if (leadTime) {
    tooltipParts.push(`Typical lead time: ${leadTime}`);
  }
  if (hasRushService) {
    tooltipParts.push('Express/rush service available');
  }
  if (hasInstantQuote) {
    tooltipParts.push('Online instant quoting');
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          'flex items-center gap-1.5 cursor-help',
          textSize,
          className
        )}>
          {/* Primary icon - prioritize rush, then instant quote, then clock */}
          {hasRushService ? (
            <Zap className={cn(iconSize, 'text-yellow-500')} />
          ) : hasInstantQuote ? (
            <Calculator className={cn(iconSize, 'text-blue-500')} />
          ) : (
            <Clock className={cn(iconSize, 'text-muted-foreground')} />
          )}
          
          {/* Display text */}
          <span className="text-muted-foreground">
            {leadTime || (hasRushService ? 'Rush available' : 'Instant quote')}
          </span>
          
          {/* Secondary indicators */}
          {leadTime && hasRushService && (
            <Zap className="h-2.5 w-2.5 text-yellow-500" />
          )}
          {(leadTime || hasRushService) && hasInstantQuote && (
            <Calculator className="h-2.5 w-2.5 text-blue-500" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          {tooltipParts.map((part, index) => (
            <p key={index} className={index === 0 ? 'font-medium' : 'text-xs text-muted-foreground'}>
              {part}
            </p>
          ))}
          <p className="text-xs text-muted-foreground italic">
            Actual times vary by project complexity
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default LeadTimeBadge;
