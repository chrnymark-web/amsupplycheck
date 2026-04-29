import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SupplierLogo from './supplier-logo';
import { Button } from './button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './sheet';
import { ExternalLink, Eye, ChevronDown, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { trackMapInteraction, trackSupplierInteraction, trackOutboundLink } from '@/lib/analytics';
import { getLocalLogoForSupplier } from '@/lib/supplierLogos';
import { trace } from '@/lib/perf-trace';

interface Supplier {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
    fullAddress: string;
  };
  technologies: string[];
  materials: string[];
  verified: boolean;
  rating: number;
  website?: string;
  logoUrl?: string;
}

interface MapProps {
  suppliers: Supplier[];
  className?: string;
  height?: string;
  showControls?: boolean;
  onVisibleSuppliersChange?: (suppliers: Supplier[]) => void;
}

const Map: React.FC<MapProps> = ({ 
  suppliers, 
  className = "", 
  height = "400px",
  showControls = true,
  onVisibleSuppliersChange
}) => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const retryCountRef = useRef(0);
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiY25ncm90aCIsImEiOiJjbWZ3bjQwem4wMTF1MmpvZXc0eTg4dWRyIn0.4UkBfHcrOwdhSgTNc-oG5g';

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use ref to track suppliers to avoid stale closures
  const suppliersRef = useRef(suppliers);
  suppliersRef.current = suppliers;
  
  const onVisibleSuppliersChangeRef = useRef(onVisibleSuppliersChange);
  onVisibleSuppliersChangeRef.current = onVisibleSuppliersChange;

  // In-flight chunked marker batch. We process up to MARKER_BATCH_SIZE marker
  // creations per requestIdleCallback tick instead of running ~100 synchronous
  // marker.addTo() calls in a single forEach. The handle lets a subsequent
  // call to addMarkersToMap() cancel the pending batch and restart with the
  // new supplier list.
  const pendingBatchRef = useRef<{ handle: number | null; jobs: Supplier[] }>({
    handle: null,
    jobs: [],
  });
  const MARKER_BATCH_SIZE = 8;

  const scheduleIdle = (cb: () => void): number => {
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (typeof ric === 'function') return ric(cb, { timeout: 200 });
    return window.setTimeout(cb, 0) as unknown as number;
  };
  const cancelIdle = (handle: number) => {
    const cic = (window as unknown as {
      cancelIdleCallback?: (h: number) => void;
    }).cancelIdleCallback;
    if (typeof cic === 'function') cic(handle);
    else window.clearTimeout(handle);
  };

  // Fits the map view to the supplier set. Called after the FINAL marker
  // batch lands, not after the first — otherwise fitBounds would zoom to
  // whatever 8 markers happened to be in batch 1, then re-zoom 12 times.
  const fitBoundsToSuppliers = (validSuppliers: Supplier[]) => {
    if (!map.current || validSuppliers.length <= 1) return;
    const bounds = new mapboxgl.LngLatBounds();
    validSuppliers.forEach((s) => bounds.extend([s.location.lng, s.location.lat]));
    map.current.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 1000 });
  };

  // Build + add a single marker to the map. Extracted from the previous
  // forEach body — same DOM, same popup wiring, same listeners.
  const createMarkerForSupplier = (supplier: Supplier) => {
    if (!map.current) return;

    const el = document.createElement('div');
    el.style.cssText = 'cursor:pointer;width:36px;height:36px;border-radius:8px;overflow:hidden;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);background:#f5f5f5;';

    const localLogo = getLocalLogoForSupplier(supplier.name);
    const logoSrc = localLogo || supplier.logoUrl;
    const whiteLogos = ['parts on demand','partzpro','sybridge','cosine','delva','forecast','forecast3d','craftcloud','3erp','fathom','imaterialise','i.materialise','oceanz','treatstock'];
    const needsDarkBg = whiteLogos.some(l => supplier.name.toLowerCase().includes(l));
    const bgColor = needsDarkBg ? '#000' : '#f5f5f5';
    el.style.background = bgColor;

    if (logoSrc) {
      el.innerHTML = `<img src="${logoSrc}" alt="${supplier.name}" style="width:100%;height:100%;object-fit:contain;padding:2px;max-width:none;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;color:#000;\\'>${supplier.name.split(' ').filter(w => w.length > 0).map(w => w[0].toUpperCase()).slice(0, 2).join('')}</div>'"/>`;
    } else {
      const initials = supplier.name.split(' ').filter(w => w.length > 0).map(w => w[0].toUpperCase()).slice(0, 2).join('');
      el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;color:#000;">${initials}</div>`;
    }

    if (supplier.verified) {
      const dot = document.createElement('div');
      dot.style.cssText = 'position:absolute;bottom:1px;right:1px;width:8px;height:8px;border-radius:50%;background:hsl(87,40%,50%);border:1.5px solid white;z-index:2;';
      el.appendChild(dot);
    }

    el.addEventListener('mouseenter', () => {
      el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
      el.style.zIndex = '10';
    });
    el.addEventListener('mouseleave', () => {
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';
      el.style.zIndex = '';
    });

    if (isMobile) {
      el.addEventListener('click', () => {
        trackMapInteraction('marker_click', { supplier_id: supplier.id, supplier_name: supplier.name, verified: supplier.verified });
        trackSupplierInteraction('click', supplier.id, supplier.name, 'map', { verified: supplier.verified });
        setSelectedSupplier(supplier);
      });
    }

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([supplier.location.lng, supplier.location.lat]);

    if (!isMobile) {
      const popup = new mapboxgl.Popup({ offset: 25, className: 'supplier-popup' })
        .setHTML(`
          <div style="padding:12px;min-width:220px;">
            <h3 style="margin:0 0 6px;font-weight:600;font-size:14px;color:#000;">${supplier.name}</h3>
            <p style="margin:0 0 12px;color:#666;font-size:12px;">${supplier.location.city}, ${supplier.location.country}</p>
            <div style="display:flex;gap:8px;">
              <button id="contact-${supplier.id}" style="flex:1;padding:6px 12px;background:hsl(87,20%,45%);color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Contact</button>
              <button id="view-${supplier.id}" style="flex:1;padding:6px 12px;background:#000;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;">View Supplier</button>
            </div>
          </div>
        `);
      popup.on('open', () => {
        document.getElementById(`contact-${supplier.id}`)?.addEventListener('click', () => {
          if (supplier.website) {
            trackOutboundLink(supplier.website, supplier.name, supplier.id);
            const w = window.open(supplier.website, '_blank');
            if (!w) window.location.href = supplier.website;
          }
        });
        document.getElementById(`view-${supplier.id}`)?.addEventListener('click', () => {
          trackSupplierInteraction('view', supplier.id, supplier.name, 'map', { verified: supplier.verified });
          navigate(`/suppliers/${supplier.id}`);
        });
      });
      marker.setPopup(popup);
    }

    marker.addTo(map.current);
    markersRef.current[supplier.id] = marker;
  };

  const addMarkersToMap = () => {
    if (!map.current || !mapLoaded) return;

    const currentSuppliers = suppliersRef.current;

    // Filter out suppliers with invalid coordinates before adding markers
    const validSuppliers = currentSuppliers.filter((supplier) => {
      const lat = supplier.location.lat;
      const lng = supplier.location.lng;

      // Filter out invalid coordinates
      if (!lat || !lng || lat === 0 || lng === 0) return false;

      // Filter out Berlin default coordinates (52.52, 13.40) - both normal AND swapped
      if (Math.abs(lat - 52.52) < 0.01 && Math.abs(lng - 13.40) < 0.01) return false;
      if (Math.abs(lat - 13.40) < 0.01 && Math.abs(lng - 52.52) < 0.01) return false;

      return true;
    });

    const currentSupplierIds = new Set(validSuppliers.map((s) => s.id));

    // Remove markers for suppliers that no longer exist
    Object.keys(markersRef.current).forEach((supplierId) => {
      if (!currentSupplierIds.has(supplierId)) {
        markersRef.current[supplierId].remove();
        delete markersRef.current[supplierId];
      }
    });

    // Single supplier: keep flyTo synchronous (one operation, not worth chunking)
    if (validSuppliers.length === 1) {
      const supplier = validSuppliers[0];
      map.current.flyTo({
        center: [supplier.location.lng, supplier.location.lat],
        zoom: 12,
        duration: 1500,
      });
    }

    // Cancel any in-flight batch — the supplier list has changed; restart from
    // the new validSuppliers so we don't add stale markers or miss new ones.
    if (pendingBatchRef.current.handle != null) {
      cancelIdle(pendingBatchRef.current.handle);
      pendingBatchRef.current.handle = null;
    }

    // Update positions for existing markers inline (cheap), and queue
    // brand-new markers for chunked addition.
    const toCreate: Supplier[] = [];
    for (const supplier of validSuppliers) {
      const existing = markersRef.current[supplier.id];
      if (existing) {
        const pos = existing.getLngLat();
        if (pos.lng !== supplier.location.lng || pos.lat !== supplier.location.lat) {
          existing.setLngLat([supplier.location.lng, supplier.location.lat]);
        }
      } else {
        toCreate.push(supplier);
      }
    }

    pendingBatchRef.current.jobs = toCreate;

    if (toCreate.length === 0) {
      // Nothing new to add; just fit bounds for the (possibly-reduced) set.
      fitBoundsToSuppliers(validSuppliers);
      return;
    }

    console.log(`Adding ${toCreate.length} markers in batches of ${MARKER_BATCH_SIZE}`);

    const processBatch = () => {
      pendingBatchRef.current.handle = null;
      if (!map.current) return;
      const jobs = pendingBatchRef.current.jobs;
      if (jobs.length === 0) return;

      const batch = jobs.splice(0, MARKER_BATCH_SIZE);
      for (const supplier of batch) {
        // Skip suppliers that were removed between batches (e.g. supplier list
        // shrank mid-stream). We only know the current valid set as of when
        // addMarkersToMap was called; the cancellation above handles fresh
        // calls, but we still guard against the supplier being absent now.
        if (!currentSupplierIds.has(supplier.id)) continue;
        if (markersRef.current[supplier.id]) continue; // raced
        createMarkerForSupplier(supplier);
      }

      if (jobs.length > 0) {
        pendingBatchRef.current.handle = scheduleIdle(processBatch);
      } else {
        // Final batch landed — now fit bounds to the full valid set.
        fitBoundsToSuppliers(validSuppliers);
      }
    };

    pendingBatchRef.current.handle = scheduleIdle(processBatch);
  };
  

  const updateVisibleSuppliers = useCallback(() => {
    if (!map.current || !onVisibleSuppliersChangeRef.current) return;
    
    const currentSuppliers = suppliersRef.current;
    if (currentSuppliers.length === 0) return;
    
    try {
      const bounds = map.current.getBounds();
      
      const visibleSuppliers = currentSuppliers.filter(supplier => {
        if (!supplier.location || typeof supplier.location.lng !== 'number' || typeof supplier.location.lat !== 'number') {
          return false;
        }
        const point = new mapboxgl.LngLat(supplier.location.lng, supplier.location.lat);
        return bounds.contains(point);
      });
      
      onVisibleSuppliersChangeRef.current(visibleSuppliers);
    } catch (error) {
      console.error('Error updating visible suppliers:', error);
    }
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    // Check WebGL support
    if (!mapboxgl.supported()) {
      console.error('WebGL is not supported in this browser/context');
      setMapError('Your browser does not support WebGL, which is required to display the map.');
      return;
    }

    // Check container has real dimensions
    const { clientWidth, clientHeight } = mapContainer.current;
    if (clientWidth === 0 || clientHeight === 0) {
      console.warn('Map container has zero dimensions, deferring init...', { clientWidth, clientHeight });
      if (retryCountRef.current < 5) {
        retryCountRef.current++;
        requestAnimationFrame(() => setTimeout(initializeMap, 100));
      } else {
        setMapError('Map container failed to get dimensions. Please try refreshing the page.');
      }
      return;
    }

    console.log('Initializing map, WebGL supported, container:', clientWidth, 'x', clientHeight);
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    try {
      // Always start with Europe view; single-supplier zoom is handled in addMarkersToMap
      const center: [number, number] = [10, 50];
      const zoom = 4;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center,
        zoom,
        attributionControl: false
      });

      if (showControls && window.innerWidth >= 1024) {
        map.current.addControl(
          new mapboxgl.NavigationControl(),
          'bottom-right'
        );
      }

      // Load timeout – retry once if load event doesn't fire
      const loadTimeout = setTimeout(() => {
        if (map.current && !map.current.loaded()) {
          console.warn('Map load timeout – retrying initialization');
          map.current.remove();
          map.current = null;
          retryCountRef.current++;
          if (retryCountRef.current <= 2) {
            initializeMap();
          } else {
            setMapError('The map failed to load. Please check your connection and try again.');
          }
        }
      }, 8000);

      map.current.on('load', () => {
        clearTimeout(loadTimeout);
        console.log('Map loaded successfully');

        // Hook WebGL context-loss into the perf trace so a renderer crash
        // shows up in the diagnostic payload. Chrome surfaces this when GPU
        // memory pressure or driver issues kill the canvas — the page may
        // appear "frozen" while Mapbox tries to recover.
        try {
          const canvas = map.current?.getCanvas();
          canvas?.addEventListener('webglcontextlost', (ev) => {
            ev.preventDefault();
            console.error('Mapbox WebGL context lost', ev);
            trace('webglcontextlost');
          }, { once: true });
          canvas?.addEventListener('webglcontextrestored', () => {
            console.log('Mapbox WebGL context restored');
            trace('webglcontextrestored');
          }, { once: true });
        } catch (err) {
          console.warn('Could not attach WebGL context listeners:', err);
        }

        // Aggressive resize sequence to force WebGL canvas to render tiles
        // This is needed because lazy-loaded components may have timing issues
        const forceResize = () => {
          if (map.current) {
            map.current.resize();
            map.current.triggerRepaint();
          }
        };

        forceResize();
        requestAnimationFrame(forceResize);
        setTimeout(forceResize, 100);
        setTimeout(forceResize, 300);
        setTimeout(forceResize, 600);

        setMapLoaded(true);
        setMapError(null);
      });

      map.current.on('idle', () => {
        updateVisibleSuppliers();
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('An error occurred while initializing the map.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showControls]);

  // Initialize map once – use ResizeObserver to wait for real dimensions
  useEffect(() => {
    if (!mapContainer.current) return;

    const container = mapContainer.current;
    let ro: ResizeObserver | null = null;
    
    // If container already has dimensions, init immediately
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      requestAnimationFrame(initializeMap);
    } else {
      // Wait for container to get real dimensions
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            ro?.disconnect();
            requestAnimationFrame(initializeMap);
          }
        }
      });
      ro.observe(container);
    }
    
    return () => {
      ro?.disconnect();
      // Cancel any in-flight chunked marker batch so we don't try to call
      // createMarkerForSupplier after the map has been removed.
      if (pendingBatchRef.current.handle != null) {
        cancelIdle(pendingBatchRef.current.handle);
        pendingBatchRef.current.handle = null;
      }
      pendingBatchRef.current.jobs = [];
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap]);

  // Add markers when suppliers change and map is loaded
  // Use suppliers.length + supplier IDs as stable dependency to avoid re-running on every render
  const supplierIds = suppliers.map(s => s.id).sort().join(',');
  useEffect(() => {
    if (suppliers.length > 0 && mapLoaded) {
      addMarkersToMap();
      const timer = setTimeout(() => updateVisibleSuppliers(), 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierIds, mapLoaded]);

  const handleRetry = () => {
    setMapError(null);
    setMapLoaded(false);
    retryCountRef.current = 0;
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    requestAnimationFrame(initializeMap);
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden shadow-card" />
      
      {/* Loading state */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 rounded-lg z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg z-10 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-foreground font-medium mb-1">Map could not be loaded</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">{mapError}</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      )}
      
      {/* Mobile Bottom Drawer */}
      {isMobile && (
        <Sheet open={!!selectedSupplier} onOpenChange={(open) => {
          if (!open) {
            setSelectedSupplier(null);
            setIsMinimized(false);
          }
        }}>
          <SheetContent 
            side="bottom" 
            className={`rounded-t-xl transition-all duration-300 ${isMinimized ? 'h-[120px]' : 'h-[280px]'}`}
          >
            {selectedSupplier && (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <SupplierLogo 
                      name={selectedSupplier.name}
                      logoUrl={selectedSupplier.logoUrl}
                      size="sm"
                    />
                    <div className="flex-1">
                      <SheetTitle className="text-left text-lg">
                        {selectedSupplier.name}
                      </SheetTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedSupplier.location.city}, {selectedSupplier.location.country}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </SheetHeader>
                
                {!isMinimized && (
                  <div className="mt-4 space-y-3">
                    {/* Technologies & Materials preview */}
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Technologies</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSupplier.technologies.slice(0, 3).map(tech => (
                          <span key={tech} className="px-2 py-1 bg-muted rounded text-xs">
                            {tech}
                          </span>
                        ))}
                        {selectedSupplier.technologies.length > 3 && (
                          <span className="px-2 py-1 text-xs text-muted-foreground">
                            +{selectedSupplier.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1"
                        variant="default"
                        onClick={() => {
                          if (selectedSupplier.website) {
                            // Track outbound link click from mobile drawer
                            trackOutboundLink(selectedSupplier.website, selectedSupplier.name, selectedSupplier.id);
                            trackSupplierInteraction('contact', selectedSupplier.id, selectedSupplier.name, 'map', {
                              verified: selectedSupplier.verified,
                              source: 'mobile_drawer',
                            });
                            const w = window.open(selectedSupplier.website, '_blank');
                            if (!w) window.location.href = selectedSupplier.website;
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Go to website
                      </Button>
                      <Button 
                        className="flex-1"
                        variant="outline"
                        onClick={() => {
                          // Track supplier view from mobile drawer
                          trackSupplierInteraction('view', selectedSupplier.id, selectedSupplier.name, 'map', {
                            verified: selectedSupplier.verified,
                            source: 'mobile_drawer',
                          });
                          navigate(`/suppliers/${selectedSupplier.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default Map;