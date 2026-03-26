import { Info } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { 
  getTechnologyInfo, 
  getMaterialInfo, 
  getPriceDisplay, 
  getLevelDisplay,
  TechnologyInfo,
  MaterialInfo 
} from '@/lib/technologyGlossary';

interface TechnologyTooltipProps {
  name: string;
  type?: 'technology' | 'material';
  children: React.ReactNode;
  showIcon?: boolean;
}

function TechnologyContent({ info }: { info: TechnologyInfo }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-foreground">{info.abbreviation}</span>
          <span className="text-xs text-muted-foreground">- {info.name}</span>
        </div>
        <p className="text-sm text-muted-foreground">{info.shortDescription}</p>
      </div>

      {/* Best for */}
      <div>
        <p className="text-xs font-medium text-foreground mb-1.5">✓ Bedst til:</p>
        <div className="flex flex-wrap gap-1">
          {info.bestFor.slice(0, 3).map((use) => (
            <Badge key={use} variant="secondary" className="text-[10px] px-1.5 py-0">
              {use}
            </Badge>
          ))}
        </div>
      </div>

      {/* Limitations */}
      {info.limitations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-1.5">⚠ Begrænsninger:</p>
          <p className="text-xs text-muted-foreground">
            {info.limitations.slice(0, 2).join(', ')}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        <div>
          <p className="text-[10px] text-muted-foreground">Styrke</p>
          <p className="text-xs">{getLevelDisplay(info.strengthLevel)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Detalje</p>
          <p className="text-xs">{getLevelDisplay(info.detailLevel)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Hastighed</p>
          <p className="text-xs">{getLevelDisplay(info.speedLevel)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Pris</p>
          <p className="text-xs">{getPriceDisplay(info.priceRange)}</p>
        </div>
      </div>
    </div>
  );
}

function MaterialContent({ info }: { info: MaterialInfo }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-foreground">{info.name.split('(')[0].trim()}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {info.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{info.shortDescription}</p>
      </div>

      {/* Properties */}
      <div>
        <p className="text-xs font-medium text-foreground mb-1.5">Egenskaber:</p>
        <div className="flex flex-wrap gap-1">
          {info.properties.slice(0, 4).map((prop) => (
            <Badge key={prop} variant="secondary" className="text-[10px] px-1.5 py-0">
              {prop}
            </Badge>
          ))}
        </div>
      </div>

      {/* Applications */}
      <div>
        <p className="text-xs font-medium text-foreground mb-1.5">Anvendelser:</p>
        <p className="text-xs text-muted-foreground">
          {info.applications.slice(0, 3).join(', ')}
        </p>
      </div>

      {/* Price */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">Prisklasse</p>
        <p className="text-xs">{getPriceDisplay(info.priceRange)}</p>
      </div>
    </div>
  );
}

export function TechnologyTooltip({ 
  name, 
  type = 'technology', 
  children,
  showIcon = false 
}: TechnologyTooltipProps) {
  const info = type === 'technology' 
    ? getTechnologyInfo(name) 
    : getMaterialInfo(name);

  // If no info found, just render children
  if (!info) {
    return <>{children}</>;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help inline-flex items-center gap-1">
          {children}
          {showIcon && (
            <Info className="h-3 w-3 text-muted-foreground opacity-60" />
          )}
        </span>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 bg-popover border border-border shadow-lg"
        side="top"
        align="start"
      >
        {type === 'technology' ? (
          <TechnologyContent info={info as TechnologyInfo} />
        ) : (
          <MaterialContent info={info as MaterialInfo} />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

// Simple inline tooltip for smaller contexts
export function TechInfoBadge({ 
  name, 
  type = 'technology',
  variant = 'secondary',
  className = ''
}: { 
  name: string; 
  type?: 'technology' | 'material';
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}) {
  return (
    <TechnologyTooltip name={name} type={type}>
      <Badge variant={variant} className={className}>
        {name}
      </Badge>
    </TechnologyTooltip>
  );
}
