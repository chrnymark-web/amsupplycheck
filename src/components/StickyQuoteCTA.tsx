import React, { useState, useEffect } from 'react';
import { QuoteRequestForm } from './QuoteRequestForm';

interface StickyQuoteCTAProps {
  supplierName: string;
  technologyPreset?: string;
}

export const StickyQuoteCTA: React.FC<StickyQuoteCTAProps> = ({ supplierName, technologyPreset }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground truncate hidden sm:block">
          Get a quote from <span className="text-primary">{supplierName}</span>
        </p>
        <QuoteRequestForm
          variant="dialog"
          supplierContext={supplierName}
          technologyPreset={technologyPreset}
          triggerLabel="Request Quote"
          triggerClassName="shrink-0"
        />
      </div>
    </div>
  );
};

export default StickyQuoteCTA;
