import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Star, Trash2, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchHistory, type SearchHistoryEntry } from '@/hooks/use-search-history';
import { useSavedSearches, type SavedSearch } from '@/hooks/use-saved-searches';
import { cn } from '@/lib/utils';

interface SearchHistoryPanelProps {
  className?: string;
  onClose?: () => void;
}

const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({ className, onClose }) => {
  const navigate = useNavigate();
  const { history, removeFromHistory, clearHistory } = useSearchHistory();
  const { savedSearches, isAuthenticated, deleteSavedSearch } = useSavedSearches();

  const buildSearchUrl = (entry: { query?: string | null; materials?: string[]; technologies?: string[]; areas?: string[]; certifications?: string[]; volume?: string | null; urgency?: string | null }) => {
    const params = new URLSearchParams();
    if (entry.query) params.set('keywords', entry.query);
    if (entry.materials?.length) params.set('materials', entry.materials.join(','));
    if (entry.technologies?.length) params.set('technologies', entry.technologies.join(','));
    if (entry.areas?.length) params.set('areas', entry.areas.join(','));
    if (entry.certifications?.length) params.set('certifications', entry.certifications.join(','));
    if (entry.volume) params.set('volume', entry.volume);
    if (entry.urgency && entry.urgency !== 'standard') params.set('urgency', entry.urgency);
    return `/search?${params.toString()}`;
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    onClose?.();
  };

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getEntryLabel = (entry: SearchHistoryEntry | SavedSearch) => {
    const parts: string[] = [];
    if (entry.query) parts.push(entry.query);
    if (entry.technologies?.length) parts.push(entry.technologies.join(', '));
    if (entry.materials?.length) parts.push(entry.materials.join(', '));
    if (entry.areas?.length) parts.push(entry.areas.join(', '));
    return parts.join(' · ') || 'All suppliers';
  };

  if (history.length === 0 && savedSearches.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-background border border-border rounded-lg shadow-lg overflow-hidden', className)}>
      {/* Saved Searches (database) */}
      {isAuthenticated && savedSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Star className="h-3.5 w-3.5" />
              Saved Searches
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {savedSearches.map(search => (
              <div
                key={search.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer group transition-colors"
                onClick={() => handleNavigate(buildSearchUrl(search))}
              >
                <Star className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{search.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{getEntryLabel(search)}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); deleteSavedSearch(search.id); }}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Login prompt for saved searches */}
      {!isAuthenticated && (
        <div className="px-3 py-2 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LogIn className="h-3.5 w-3.5" />
            <span>
              <button
                className="text-primary hover:underline font-medium"
                onClick={() => { navigate('/auth'); onClose?.(); }}
              >
                Sign in
              </button>
              {' '}to save searches across devices
            </span>
          </div>
        </div>
      )}

      {/* Recent History (localStorage) */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Recent Searches
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs text-muted-foreground hover:text-foreground px-1"
              onClick={clearHistory}
            >
              Clear all
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {history.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer group transition-colors"
                onClick={() => handleNavigate(buildSearchUrl(entry))}
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{getEntryLabel(entry)}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTimestamp(entry.timestamp)}</span>
                    {entry.resultsCount !== undefined && (
                      <span>· {entry.resultsCount} results</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeFromHistory(entry.id); }}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHistoryPanel;
