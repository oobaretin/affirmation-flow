import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, type UserSettings } from '../types/settings';
import { initMemoryStorage, readStorage, writeStorage } from '../storage/memoryStorage';

const STORAGE_KEY = 'affirmation-flow-settings';

function loadSettings(): UserSettings {
  try {
    const stored = readStorage(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored) as Partial<UserSettings>;
    const merged = { ...DEFAULT_SETTINGS, ...parsed };

    if (merged.voiceProvider === 'device') {
      merged.voiceProvider = 'elevenlabs';
    }

    if (merged.onboardingComplete && parsed.isLoggedIn === undefined) {
      merged.isLoggedIn = true;
    }

    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  ready: boolean;
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  completeOnboarding: (updates: Partial<UserSettings>) => void;
  resetOnboarding: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    void initMemoryStorage().then(() => {
      setSettings(loadSettings());
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStorage(STORAGE_KEY, JSON.stringify(settings));
  }, [ready, settings]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const completeOnboarding = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates, onboardingComplete: true, isLoggedIn: true }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setSettings((prev) => ({ ...prev, onboardingComplete: false, isLoggedIn: false }));
  }, []);

  const value = useMemo(
    () => ({ ready, settings, updateSettings, completeOnboarding, resetOnboarding }),
    [ready, settings, updateSettings, completeOnboarding, resetOnboarding],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
