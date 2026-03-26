import { ExternalLink, MapPin, CheckCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TechInfoBadge } from '@/components/TechnologyTooltip';

interface ChatSupplierCardProps {
  supplier: {
    supplier_id: string;
    name: string;
    website?: string;
    description?: string;
    technologies?: string[];
    materials?: string[];
    region?: string;
    location_city?: string;
    location_country?: string;
    verified?: boolean;
    premium?: boolean;
    logo_url?: string;
  };
  detailed?: boolean;
}

export function ChatSupplierCard({ supplier, detailed = false }: ChatSupplierCardProps) {
  const location = [supplier.location_city, supplier.location_country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
      <div className="flex flex-col gap-2">
        {/* Header row: Logo + Name + Badges + Actions */}
        <div className="flex items-center gap-2">
          {/* Logo or placeholder */}
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {supplier.logo_url ? (
              <img 
                src={supplier.logo_url} 
                alt={supplier.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">
                {supplier.name.charAt(0)}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <Link 
              to={`/suppliers/${supplier.supplier_id}`}
              className="font-medium text-sm text-foreground hover:text-primary transition-colors truncate"
              title={supplier.name}
            >
              {supplier.name}
            </Link>
            {supplier.verified && (
              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            )}
            {supplier.premium && (
              <Star className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 fill-yellow-500" />
            )}
          </div>
          
          {/* Actions inline on the right */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2 text-xs"
              asChild
            >
              <Link to={`/suppliers/${supplier.supplier_id}`}>
                View
              </Link>
            </Button>
            {supplier.website && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                asChild
              >
                <a 
                  href={supplier.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Visit website"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        )}

        {/* Technologies - show first 3 with tooltips */}
        {supplier.technologies && supplier.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {supplier.technologies.slice(0, 3).map((tech) => (
              <TechInfoBadge 
                key={tech} 
                name={tech}
                type="technology"
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              />
            ))}
            {supplier.technologies.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0"
              >
                +{supplier.technologies.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Description for detailed view */}
        {detailed && supplier.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {supplier.description}
          </p>
        )}

        {/* Materials for detailed view */}
        {detailed && supplier.materials && supplier.materials.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {supplier.materials.slice(0, 5).map((material) => (
              <Badge 
                key={material} 
                variant="outline" 
                className="text-[10px] px-1.5 py-0"
              >
                {material}
              </Badge>
            ))}
            {supplier.materials.length > 5 && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0"
              >
                +{supplier.materials.length - 5}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}