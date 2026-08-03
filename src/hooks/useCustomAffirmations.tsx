import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Affirmation } from '../data/affirmations';

const STORAGE_KEY = 'affirmation-flow-custom';

function loadCustom(): Affirmation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

interface CustomAffirmationsContextValue {
  custom: Affirmation[];
  addCustom: (text: string, category?: string) => Affirmation;
  addMany: (items: { text: string; category?: string }[]) => Affirmation[];
  removeCustom: (id: string) => void;
  clearCustom: () => void;
}

const CustomAffirmationsContext = createContext<CustomAffirmationsContextValue | null>(null);

export function CustomAffirmationsProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<Affirmation[]>(loadCustom);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  }, [custom]);

  const addCustom = useCallback((text: string, category = 'Custom') => {
    const affirmation: Affirmation = {
      id: `custom-${Date.now()}`,
      text: text.trim(),
      category,
    };
    setCustom((prev) => [affirmation, ...prev]);
    return affirmation;
  }, []);

  const addMany = useCallback((items: { text: string; category?: string }[]) => {
    const baseId = Date.now();
    const affirmations = items
      .filter((item) => item.text.trim())
      .map((item, index) => ({
        id: `custom-${baseId}-${index}`,
        text: item.text.trim(),
        category: item.category ?? 'Custom',
      }));

    if (affirmations.length === 0) return [];

    setCustom((prev) => [...affirmations, ...prev]);
    return affirmations;
  }, []);

  const clearCustom = useCallback(() => {
    setCustom([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeCustom = useCallback((id: string) => {
    setCustom((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <CustomAffirmationsContext.Provider
      value={{ custom, addCustom, addMany, removeCustom, clearCustom }}
    >
      {children}
    </CustomAffirmationsContext.Provider>
  );
}

export function useCustomAffirmations() {
  const context = useContext(CustomAffirmationsContext);
  if (!context) {
    throw new Error('useCustomAffirmations must be used within CustomAffirmationsProvider');
  }
  return context;
}
