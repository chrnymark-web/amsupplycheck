import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SitemapRedirect = () => {
  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        // Call the edge function to generate sitemap
        const { data, error } = await supabase.functions.invoke('generate-sitemap', {
          method: 'GET',
        });

        if (error) {
          console.error('Error fetching sitemap:', error);
          return;
        }

        // Create a blob from the XML data and trigger download
        const blob = new Blob([data], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        // Replace current page with XML content
        document.open();
        document.write(data);
        document.close();
        
        // Clean up
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating sitemap:', error);
      }
    };

    fetchSitemap();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Generating sitemap...</p>
      </div>
    </div>
  );
};

export default SitemapRedirect;
