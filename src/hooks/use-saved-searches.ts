import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  materials: string[];
  technologies: string[];
  areas: string[];
  certifications: string[];
  volume: string | null;
  urgency: string | null;
  created_at: string;
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchSavedSearches = useCallback(async () => {
    if (!user) {
      setSavedSearches([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_searches' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches((data as any[]) || []);
    } catch (err: any) {
      console.error('Error fetching saved searches:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  const saveSearch = useCallback(async (search: {
    name: string;
    query?: string;
    materials?: string[];
    technologies?: string[];
    areas?: string[];
    certifications?: string[];
    volume?: string;
    urgency?: string;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_searches' as any)
        .insert({
          user_id: user.id,
          name: search.name,
          query: search.query || null,
          materials: search.materials || [],
          technologies: search.technologies || [],
          areas: search.areas || [],
          certifications: search.certifications || [],
          volume: search.volume || null,
          urgency: search.urgency || 'standard',
        } as any);

      if (error) throw error;

      toast({ title: 'Search saved!', description: `"${search.name}" has been saved.` });
      await fetchSavedSearches();
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  }, [user, toast, fetchSavedSearches]);

  const deleteSavedSearch = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_searches' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSavedSearches(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Deleted', description: 'Saved search removed.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }, [user, toast]);

  return {
    savedSearches,
    loading,
    isAuthenticated: !!user,
    saveSearch,
    deleteSavedSearch,
    refetch: fetchSavedSearches,
  };
}
