import { useState, useCallback, useEffect } from 'react';

export interface SearchHistoryEntry {
  id: string;
  query: string;
  materials: string[];
  technologies: string[];
  areas: string[];
  certifications: string[];
  volume?: string;
  urgency?: string;
  resultsCount?: number;
  timestamp: number;
}

const STORAGE_KEY = 'amsupplycheck_search_history';
const MAX_ENTRIES = 20;

function loadHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: SearchHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>(loadHistory);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setHistory(loadHistory());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addToHistory = useCallback((entry: Omit<SearchHistoryEntry, 'id' | 'timestamp'>) => {
    // Don't add empty searches
    if (!entry.query?.trim() && entry.materials.length === 0 && entry.technologies.length === 0) return;

    setHistory(prev => {
      // Deduplicate by query + filters combination
      const fingerprint = JSON.stringify({
        q: entry.query?.toLowerCase().trim(),
        m: [...entry.materials].sort(),
        t: [...entry.technologies].sort(),
        a: [...entry.areas].sort(),
      });

      const filtered = prev.filter(h => {
        const hFingerprint = JSON.stringify({
          q: h.query?.toLowerCase().trim(),
          m: [...h.materials].sort(),
          t: [...h.technologies].sort(),
          a: [...h.areas].sort(),
        });
        return hFingerprint !== fingerprint;
      });

      const newEntry: SearchHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
