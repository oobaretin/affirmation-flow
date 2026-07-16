import { useCallback, useEffect, useState } from 'react';
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

export function useCustomAffirmations() {
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

  return { custom, addCustom, addMany, removeCustom, clearCustom };
}
