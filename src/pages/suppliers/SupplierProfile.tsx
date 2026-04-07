import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useSupplierDetail } from '@/hooks/use-suppliers';
import Navbar from '@/components/ui/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SupplierLogo from '@/components/ui/supplier-logo';
import { MapPin, ExternalLink, Verified, ArrowLeft, Globe, Factory, Shield, Tag, Cpu, Building2 } from 'lucide-react';

const SupplierProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: supplier, isLoading, error } = useSupplierDetail(slug || '');

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!supplier || error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Supplier not found</h1>
            <p className="text-muted-foreground mb-4">The supplier you're looking for doesn't exist.</p>
            <Link to="/suppliers">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to suppliers</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  const pageTitle = `${supplier.name} - Manufacturing Supplier | Supplycheck`;
  const pageDescription = supplier.description || `${supplier.name} offers ${supplier.technologies.map(t => t.name).join(', ')} manufacturing services.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link to="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to suppliers
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header card */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url || undefined} size="2xl" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
                        {supplier.verified && <Verified className="h-5 w-5 text-primary" />}
                      </div>
                      {(supplier.location_city || supplier.location_country) && (
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>{[supplier.location_city, supplier.country?.name || supplier.location_country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {supplier.description && (
                        <p className="text-muted-foreground leading-relaxed">{supplier.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technologies */}
              {supplier.technologies.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Cpu className="h-5 w-5 text-primary" /> Technologies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supplier.technologies.map(tech => (
                        <Link key={tech.id} to={`/suppliers?tech=${tech.slug}`}>
                          <Badge variant="secondary" className="text-sm py-1.5 px-3 hover:bg-primary/20 transition-colors cursor-pointer">
                            {tech.name}
                            {tech.category && <span className="ml-1.5 text-xs text-muted-foreground">({tech.category})</span>}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Materials */}
              {supplier.materials.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Factory className="h-5 w-5 text-primary" /> Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {supplier.materials.map(mat => (
                        <Link key={mat.id} to={`/suppliers?mat=${mat.slug}`}>
                          <div className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 transition-colors cursor-pointer">
                            <span className="text-sm text-foreground">{mat.name}</span>
                            {mat.category && <span className="text-xs text-muted-foreground ml-auto">{mat.category}</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {supplier.certifications.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-primary" /> Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supplier.certifications.map(cert => (
                        <Badge key={cert.id} className="text-sm py-1.5 px-3 bg-primary/10 text-primary border border-primary/20">
                          {cert.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags / Industries */}
              {supplier.tags.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="h-5 w-5 text-primary" /> Capabilities & Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supplier.tags.map(tag => (
                        <Badge key={tag.id} variant="outline" className="text-sm py-1.5 px-3">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact card */}
              <Card className="bg-card border-border sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Contact Supplier</h3>
                  
                  {supplier.website && (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 text-sm font-medium transition-colors"
                    >
                      Visit Website <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="space-y-3 text-sm">
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">
                          {supplier.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    )}
                    {(supplier.location_city || supplier.location_country) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span>{[supplier.location_city, supplier.country?.name || supplier.location_country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {supplier.verified && (
                      <div className="flex items-center gap-2 text-primary">
                        <Verified className="h-4 w-4 flex-shrink-0" />
                        <span>Verified Supplier</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick facts */}
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">Quick Facts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Technologies</span>
                      <span className="text-foreground font-medium">{supplier.technologies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials</span>
                      <span className="text-foreground font-medium">{supplier.materials.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certifications</span>
                      <span className="text-foreground font-medium">{supplier.certifications.length}</span>
                    </div>
                    {supplier.country?.region && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region</span>
                        <span className="text-foreground font-medium">{supplier.country.region}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SupplierProfile;
