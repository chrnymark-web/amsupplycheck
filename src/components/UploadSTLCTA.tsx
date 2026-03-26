import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, Zap, ArrowRight } from 'lucide-react';
import { trackCTAClick } from '@/lib/analytics';

interface UploadSTLCTAProps {
  instantQuoteCount?: number;
  className?: string;
}

export const UploadSTLCTA: React.FC<UploadSTLCTAProps> = ({ instantQuoteCount, className }) => {
  return (
    <section className={`rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8 ${className || ''}`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-foreground mb-1">
            Get Instant Quotes for Your 3D Parts
          </h3>
          <p className="text-muted-foreground">
            Upload your STL/STEP file and receive pricing from
            {instantQuoteCount ? ` ${instantQuoteCount}+` : ''} suppliers with instant quoting.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link to="/search?instantQuote=true" onClick={() => trackCTAClick('upload_stl_cta', 'instant_quote')}>
            <Button className="gap-2">
              <Zap className="h-4 w-4" /> Find Instant Quote Suppliers <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UploadSTLCTA;
