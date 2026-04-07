import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Bug, Trash2, Download } from 'lucide-react';
import { GA_DEBUG_MODE } from '@/lib/analytics';

export const GADebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isEnabled] = useState(GA_DEBUG_MODE);

  useEffect(() => {
    if (!isEnabled) return;

    // Update events every second
    const interval = setInterval(() => {
      if (window.gaDebugEvents) {
        setEvents([...window.gaDebugEvents]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isEnabled]);

  const clearEvents = () => {
    if (window.gaDebugEvents) {
      window.gaDebugEvents = [];
      setEvents([]);
    }
  };

  const downloadEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `ga-events-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleDebugMode = () => {
    const newMode = !isEnabled;
    localStorage.setItem('ga_debug', String(newMode));
    window.location.reload();
  };

  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleDebugMode}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Bug className="h-4 w-4" />
          Enable GA Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          variant="default"
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary to-primary/80"
        >
          <Bug className="h-4 w-4" />
          GA Debug ({events.length})
        </Button>
      ) : (
        <Card className="w-[600px] max-h-[600px] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Google Analytics Debug</h3>
              <Badge variant="outline">{events.length} events</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={downloadEvents}
                variant="ghost"
                size="sm"
                disabled={events.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={clearEvents}
                variant="ghost"
                size="sm"
                disabled={events.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={toggleDebugMode}
                variant="ghost"
                size="sm"
              >
                Disable
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Events List */}
          <ScrollArea className="flex-1 p-4">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bug className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No events tracked yet</p>
                <p className="text-sm mt-1">Interact with the page to see events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <Card key={index} className={`p-3 ${event.success ? 'border-green-500/20' : 'border-red-500/20'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={event.success ? 'default' : 'destructive'}>
                          {event.eventName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.success ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ✓ Sent
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          ✗ Failed
                        </Badge>
                      )}
                    </div>
                    
                    {Object.keys(event.params).length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Parameters:</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(event.params).map(([key, value]) => (
                            <div key={key} className="flex gap-1 truncate">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-mono">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <p>💡 Open browser console for detailed logs</p>
            <p className="mt-1">🔍 Events automatically sync with GA4 Real-Time reports</p>
          </div>
        </Card>
      )}
    </div>
  );
};
