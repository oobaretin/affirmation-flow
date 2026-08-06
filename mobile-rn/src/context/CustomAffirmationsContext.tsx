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

const STORAGE_KEY = 'affirmation-flow-custom';

function loadCustom(): Affirmation[] {
  try {
    const stored = readStorage(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Affirmation[];
  } catch {
    return [];
  }
}

function createCustomAffirmation(text: string): Affirmation {
  return {
    id: `custom-${Date.now()}`,
    text,
    category: 'Custom',
  };
}

interface CustomAffirmationsContextValue {
  custom: Affirmation[];
  addCustom: (text: string) => void;
  removeCustom: (id: string) => void;
}

const CustomAffirmationsContext = createContext<CustomAffirmationsContextValue | null>(null);

export function CustomAffirmationsProvider({ children }: { children: ReactNode }) {
  const { ready } = useSettings();
  const [custom, setCustom] = useState<Affirmation[]>([]);

  useEffect(() => {
    if (!ready) return;
    setCustom(loadCustom());
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    writeStorage(STORAGE_KEY, JSON.stringify(custom));
  }, [custom, ready]);

  const addCustom = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setCustom((prev) => [createCustomAffirmation(trimmed), ...prev]);
  }, []);

  const removeCustom = useCallback((id: string) => {
    setCustom((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ custom, addCustom, removeCustom }),
    [custom, addCustom, removeCustom],
  );

  return (
    <CustomAffirmationsContext.Provider value={value}>{children}</CustomAffirmationsContext.Provider>
  );
}

export function useCustomAffirmations() {
  const context = useContext(CustomAffirmationsContext);
  if (!context) {
    throw new Error('useCustomAffirmations must be used within CustomAffirmationsProvider');
  }
  return context;
}
