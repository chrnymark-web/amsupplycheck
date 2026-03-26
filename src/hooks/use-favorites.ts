import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'supplycheck_favorite_suppliers';

export interface FavoriteSupplier {
  supplier_id: string;
  name: string;
  addedAt: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteSupplier[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  const saveFavorites = useCallback((newFavorites: FavoriteSupplier[]) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, []);

  const addFavorite = useCallback((supplier: { supplier_id: string; name: string }) => {
    const newFavorite: FavoriteSupplier = {
      supplier_id: supplier.supplier_id,
      name: supplier.name,
      addedAt: new Date().toISOString(),
    };
    
    setFavorites(prev => {
      // Check if already exists
      if (prev.some(f => f.supplier_id === supplier.supplier_id)) {
        return prev;
      }
      const updated = [...prev, newFavorite];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((supplierId: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.supplier_id !== supplierId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((supplier: { supplier_id: string; name: string }) => {
    const isFavorited = favorites.some(f => f.supplier_id === supplier.supplier_id);
    if (isFavorited) {
      removeFavorite(supplier.supplier_id);
    } else {
      addFavorite(supplier);
    }
    return !isFavorited;
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((supplierId: string) => {
    return favorites.some(f => f.supplier_id === supplierId);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length,
  };
}
