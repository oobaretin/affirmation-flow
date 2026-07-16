import { useCallback, useEffect, useState } from 'react';
import type { Affirmation } from '../data/affirmations';

const STORAGE_KEY = 'affirmation-flow-favorites';

function loadFavorites(): Affirmation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Affirmation[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((affirmation: Affirmation) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === affirmation.id);
      return exists
        ? prev.filter((f) => f.id !== affirmation.id)
        : [...prev, affirmation];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites };
}
