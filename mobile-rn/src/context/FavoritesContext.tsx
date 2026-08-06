import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Affirmation } from '../data/affirmations';
import { readStorage, writeStorage } from '../storage/memoryStorage';
import { useSettings } from './SettingsContext';

const STORAGE_KEY = 'affirmation-flow-favorites';

function loadFavorites(): Affirmation[] {
  try {
    const stored = readStorage(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Affirmation[];
  } catch {
    return [];
  }
}

interface FavoritesContextValue {
  favorites: Affirmation[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: Affirmation) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { ready } = useSettings();
  const [favorites, setFavorites] = useState<Affirmation[]>([]);

  useEffect(() => {
    if (!ready) return;
    setFavorites(loadFavorites());
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    writeStorage(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, ready]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((item) => item.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((item: Affirmation) => {
    setFavorites((prev) => {
      if (prev.some((entry) => entry.id === item.id)) {
        return prev.filter((entry) => entry.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites }),
    [favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
