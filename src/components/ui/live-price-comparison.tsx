import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Upload, ArrowUpDown, ExternalLink, AlertCircle, Clock, Package, Signal, BarChart3 } from 'lucide-react';
import { useLiveQuotes } from '@/hooks/use-live-quotes';
import type { LiveQuote, EstimatedPrice, Currency } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface LivePriceComparisonProps {
  /** Estimated prices for non-API suppliers (passed from parent) */
  estimatedPrices?: EstimatedPrice[];
  currency?: Currency;
  countryCode?: string;
  className?: string;
}

type SortField = 'price' | 'leadTime' | 'supplier';

const SOURCE_COLORS: Record<string, string> = {
  craftcloud: 'bg-blue-500/10 text-blue-600 border-blue-200',
  treatstock: 'bg-green-500/10 text-green-600 border-green-200',
};

function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function LiveQuoteRow({ quote, isLowest }: { quote: LiveQuote; isLowest: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm',
        isLowest
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card hover:border-border/80'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Signal className="h-3 w-3 text-green-500 shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {quote.supplierName}
          </span>
          {isLowest && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
              Lowest
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-5">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', SOURCE_COLORS[quote.source])}>
            Live
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            via {quote.source === 'craftcloud' ? 'Craftcloud' : 'Treatstock'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Clock className="h-3 w-3" />
        <span>
          {quote.estimatedLeadTimeDays ? `${quote.estimatedLeadTimeDays}d` : '—'}
        </span>
      </div>

      <div className="text-right shrink-0">
        <div className={cn('text-sm font-semibold', isLowest ? 'text-primary' : 'text-foreground')}>
          {formatPrice(quote.unitPrice, quote.currency)}
        </div>
        {quote.shippingEstimate !== null && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
            <Package className="h-2.5 w-2.5" />
            +{formatPrice(quote.shippingEstimate, quote.currency)}
          </div>
        )}
      </div>

      {quote.quoteUrl && (
        <a
          href={quote.quoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function EstimatedPriceRow({ price }: { price: EstimatedPrice }) {
  const tierColors: Record<string, string> = {
    '€': 'text-green-600',
    '€€': 'text-yellow-600',
    '€€€': 'text-orange-600',
    '€€€€': 'text-red-600',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {price.supplierName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
            Estimate
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {price.basedOn}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className={cn('text-sm font-semibold', tierColors[price.priceTier] || 'text-foreground')}>
          {price.priceTier}
        </div>
        <div className="text-[10px] text-muted-foreground">
          ~{formatPrice(price.priceRangeLow, price.currency)} – {formatPrice(price.priceRangeHigh, price.currency)}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function LivePriceComparison({
  estimatedPrices = [],
  currency = 'EUR',
  countryCode = 'DK',
  className,
}: LivePriceComparisonProps) {
  const { getQuotes, liveQuotes, results, hasErrors, isLoading, error } = useLiveQuotes({
    currency,
    countryCode,
  });

  const [sortField, setSortField] = useState<SortField>('price');
  const [sortAsc, setSortAsc] = useState(true);
  const [showEstimates, setShowEstimates] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(true); }
  };

  const sortedLive = [...liveQuotes].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    switch (sortField) {
      case 'price': return (a.unitPrice - b.unitPrice) * dir;
      case 'leadTime': return ((a.estimatedLeadTimeDays ?? 999) - (b.estimatedLeadTimeDays ?? 999)) * dir;
      case 'supplier': return a.supplierName.localeCompare(b.supplierName) * dir;
    }
  });

  const lowestPrice = liveQuotes.length > 0
    ? Math.min(...liveQuotes.map((q) => q.unitPrice))
    : null;

  const handleFile = useCallback(
    (file: File) => {
      const validExts = ['.stl', '.obj', '.3mf', '.step', '.stp'];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!validExts.includes(ext)) return;
      getQuotes(file, 1);
    },
    [getQuotes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  return (
    <Card className={cn('bg-gradient-card border-border shadow-card', className)}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Price Comparison</h3>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-[10px] text-green-600">
              <Signal className="h-2.5 w-2.5" />
              Live
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <BarChart3 className="h-2.5 w-2.5" />
              Estimate
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {/* Upload Zone */}
        {liveQuotes.length === 0 && !isLoading && (
          <label
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
          >
            <Upload className={cn('h-8 w-8', dragActive ? 'text-primary' : 'text-muted-foreground')} />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Upload 3D model for live prices
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                STL, OBJ, 3MF, STEP — get real quotes from 90+ vendors
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".stl,.obj,.3mf,.step,.stp"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
          </label>
        )}

        {/* Loading */}
        {isLoading && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Fetching live prices from 90+ vendors...
            </p>
            <LoadingSkeleton />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{error.message}</p>
          </div>
        )}

        {/* Live Quotes */}
        {!isLoading && liveQuotes.length > 0 && (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Signal className="h-3 w-3 text-green-500" />
              <span className="text-xs font-medium text-foreground">
                {liveQuotes.length} live quotes
              </span>
              <div className="flex items-center gap-1 ml-auto">
                {(['price', 'leadTime', 'supplier'] as SortField[]).map((field) => (
                  <Button
                    key={field}
                    variant="ghost"
                    size="sm"
                    className={cn('h-5 text-[10px] px-1.5', sortField === field && 'bg-accent')}
                    onClick={() => handleSort(field)}
                  >
                    {field === 'price' ? 'Price' : field === 'leadTime' ? 'Lead' : 'Name'}
                    {sortField === field && <ArrowUpDown className="h-2 w-2 ml-0.5" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {sortedLive.slice(0, 20).map((quote, i) => (
                <LiveQuoteRow
                  key={`${quote.supplierId}-${i}`}
                  quote={quote}
                  isLowest={quote.unitPrice === lowestPrice}
                />
              ))}
              {sortedLive.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{sortedLive.length - 20} more quotes
                </p>
              )}
            </div>

            {/* Partial errors */}
            {hasErrors && (
              <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-200">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  {results.filter((r) => r.error).map((r) => (
                    <p key={r.supplier}>{r.supplier}: {r.error}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new */}
            <label className="mt-2 flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
              <Upload className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Upload new file</span>
              <input
                type="file"
                className="hidden"
                accept=".stl,.obj,.3mf,.step,.stp"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
            </label>
          </div>
        )}

        {/* Estimated Prices (always shown if available) */}
        {estimatedPrices.length > 0 && (
          <div className={cn(liveQuotes.length > 0 && 'mt-4 pt-3 border-t border-border')}>
            <button
              className="flex items-center gap-2 mb-2 w-full text-left"
              onClick={() => setShowEstimates((v) => !v)}
            >
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {estimatedPrices.length} estimated prices (market data)
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {showEstimates ? 'Hide' : 'Show'}
              </span>
            </button>
            {showEstimates && (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {estimatedPrices.map((price) => (
                  <EstimatedPriceRow key={price.supplierId} price={price} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
