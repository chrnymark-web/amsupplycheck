import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, DollarSign } from 'lucide-react';
import { getSupplierPriceTier } from '@/lib/supplierPricing';
import { LeadTimeBadge } from '@/components/pricing/LeadTimeBadge';

interface PriceComparisonWidgetProps {
  technology?: string;
  material?: string;
  excludeSupplierId?: string;
  limit?: number;
  className?: string;
}

export const PriceComparisonWidget: React.FC<PriceComparisonWidgetProps> = ({
  technology,
  material,
  excludeSupplierId,
  limit = 5,
  className,
}) => {
  const { data: suppliers } = useQuery({
    queryKey: ['price-comparison', technology, material, excludeSupplierId, limit],
    queryFn: async () => {
      let query = supabase.from('suppliers').select('supplier_id, name, technologies, materials, lead_time_indicator, has_instant_quote, verified, location_country');
      
      if (technology) query = query.contains('technologies', [technology]);
      if (material) query = query.contains('materials', [material]);
      if (excludeSupplierId) query = query.neq('supplier_id', excludeSupplierId);
      
      query = query.eq('verified', true).limit(limit);
      const { data } = await query;
      return data || [];
    },
    enabled: !!(technology || material),
  });

  if (!suppliers || suppliers.length === 0) return null;

  return (
    <Card className={`border-border ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Price Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suppliers.map((s) => {
          const tier = getSupplierPriceTier(s.technologies || []);
          return (
            <div key={s.supplier_id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <Link to={`/suppliers/${s.supplier_id}`} className="font-medium text-foreground hover:text-primary truncate block">
                  {s.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold ${tier.color}`}>{tier.symbol}</span>
                  {s.has_instant_quote && <Badge variant="outline" className="text-[10px] px-1.5 py-0">⚡ Instant</Badge>}
                  {s.lead_time_indicator && <span className="text-xs text-muted-foreground">{s.lead_time_indicator}</span>}
                </div>
              </div>
              <Link to={`/suppliers/${s.supplier_id}`}>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PriceComparisonWidget;
