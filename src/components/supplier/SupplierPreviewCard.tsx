import React from 'react';
import { Badge } from '@/components/ui/badge';
import SupplierLogo from '@/components/ui/supplier-logo';
import { MapPin, Verified, Crown, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplierPreviewProps {
  supplier: {
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
    isPartner?: boolean;
    logoUrl?: string;
  };
  onClick?: () => void;
  className?: string;
}

const SupplierPreviewCard: React.FC<SupplierPreviewProps> = ({ 
  supplier, 
  onClick,
  className 
}) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg cursor-pointer",
        "hover:bg-accent hover:border-primary/30 hover:shadow-sm transition-all duration-200",
        "group",
        className
      )}
      onClick={onClick}
    >
      <SupplierLogo 
        name={supplier.name} 
        logoUrl={supplier.logoUrl}
        size="md"
        className="flex-shrink-0 group-hover:scale-105 transition-transform"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {supplier.name}
          </span>
          {supplier.isPartner && (
            <Star className="h-3 w-3 text-supplier-partner fill-current flex-shrink-0" aria-label="Paying SupplyCheck partner" />
          )}
          {supplier.verified && (
            <Verified className="h-3 w-3 text-supplier-verified flex-shrink-0" />
          )}
          {supplier.premium && (
            <Crown className="h-3 w-3 text-supplier-premium flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="truncate">{supplier.location.city}, {supplier.location.country}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-1">
          {supplier.technologies.slice(0, 2).map((tech, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {tech}
            </Badge>
          ))}
          {supplier.technologies.length > 2 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              +{supplier.technologies.length - 2}
            </Badge>
          )}
        </div>
        
      </div>
      
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </div>
  );
};

export default SupplierPreviewCard;
