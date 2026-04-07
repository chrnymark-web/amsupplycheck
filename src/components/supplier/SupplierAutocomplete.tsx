import React from 'react';
import { cn } from '@/lib/utils';
import { Building2, MapPin, CheckCircle, Star } from 'lucide-react';

interface SupplierSuggestion {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
  };
  verified: boolean;
  premium: boolean;
  logoUrl?: string;
}

interface SupplierAutocompleteProps {
  suggestions: SupplierSuggestion[];
  isVisible: boolean;
  onSelect: (supplier: SupplierSuggestion) => void;
  highlightedIndex: number;
  onMouseEnter: (index: number) => void;
}

const SupplierAutocomplete: React.FC<SupplierAutocompleteProps> = ({
  suggestions,
  isVisible,
  onSelect,
  highlightedIndex,
  onMouseEnter
}) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl shadow-black/10 z-[60] max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 bg-gradient-to-b from-background to-muted/30">
      <div className="py-1">
        <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
          Leverandører
        </div>
        {suggestions.map((supplier, index) => (
          <button
            key={supplier.id}
            type="button"
            className={cn(
              "w-full px-3 py-2 flex items-center gap-3 text-left transition-colors",
              highlightedIndex === index 
                ? "bg-accent" 
                : "hover:bg-muted/50"
            )}
            onClick={() => onSelect(supplier)}
            onMouseEnter={() => onMouseEnter(index)}
          >
            {/* Logo or placeholder */}
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {supplier.logoUrl ? (
                <img 
                  src={supplier.logoUrl} 
                  alt={supplier.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Building2 className={cn("h-4 w-4 text-muted-foreground", supplier.logoUrl && "hidden")} />
            </div>
            
            {/* Supplier info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm text-foreground truncate">
                  {supplier.name}
                </span>
                {supplier.premium && (
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
                {supplier.verified && (
                  <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {supplier.location.city}{supplier.location.city && supplier.location.country ? ', ' : ''}{supplier.location.country}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SupplierAutocomplete;
