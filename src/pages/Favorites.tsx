import { Heart, Trash2, ExternalLink, MapPin, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFavorites } from '@/hooks/use-favorites';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Navbar from '@/components/ui/navbar';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();

  // Fetch full supplier details for favorited suppliers
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['favorite-suppliers', favorites.map(f => f.supplier_id)],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .in('supplier_id', favorites.map(f => f.supplier_id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: favorites.length > 0,
  });

  const handleRemove = (supplierId: string, name: string) => {
    removeFavorite(supplierId);
    toast.info(`${name} removed from favorites`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>My Favorites | AMSupplyCheck</title>
        <link rel="canonical" href="https://amsupplycheck.com/favorites" />
      </Helmet>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
            <Heart className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Favorites</h1>
            <p className="text-sm text-muted-foreground">
              {favorites.length} {favorites.length === 1 ? 'supplier' : 'suppliers'} saved
            </p>
          </div>
        </div>

        {/* Empty state */}
        {favorites.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No favorites yet
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Use AI Match to find suppliers and save them as favorites by clicking the heart icon.
              </p>
              <Button onClick={() => navigate('/match')}>
                Find suppliers
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && favorites.length > 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Favorites list */}
        {!isLoading && suppliers && suppliers.length > 0 && (
          <div className="space-y-4">
            {suppliers.map((supplier) => {
              const favorite = favorites.find(f => f.supplier_id === supplier.supplier_id);
              const location = [supplier.location_city, supplier.location_country]
                .filter(Boolean)
                .join(', ');

              return (
                <Card 
                  key={supplier.supplier_id}
                  className="hover:border-primary/30 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {supplier.logo_url ? (
                          <img 
                            src={supplier.logo_url} 
                            alt={supplier.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground">
                            {supplier.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/suppliers/${supplier.supplier_id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {supplier.name}
                        </Link>
                        
                        {location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{location}</span>
                          </div>
                        )}

                        {supplier.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {supplier.description}
                          </p>
                        )}

                        {favorite && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Added {new Date(favorite.addedAt).toLocaleDateString('en-US')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          asChild
                        >
                          <Link to={`/suppliers/${supplier.supplier_id}`}>
                            View profile
                          </Link>
                        </Button>
                        
                        {supplier.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a 
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-1"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Website
                            </a>
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleRemove(supplier.supplier_id, supplier.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
