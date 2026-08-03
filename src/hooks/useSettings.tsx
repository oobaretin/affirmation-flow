import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type UserSettings } from '../types/settings';

const STORAGE_KEY = 'affirmation-flow-settings';

function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
  settings: UserSettings;
  loaded: boolean;
  updateSettings: (updates: Partial<UserSettings>) => void;
  completeOnboarding: (updates: Partial<UserSettings>) => void;
  resetOnboarding: () => void;
  logout: () => void;
  login: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const loaded = true;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const completeOnboarding = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates, onboardingComplete: true, isLoggedIn: true }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setSettings((prev) => ({ ...prev, onboardingComplete: false }));
  }, []);

  const logout = useCallback(() => {
    setSettings((prev) => ({ ...prev, isLoggedIn: false }));
  }, []);

  const login = useCallback(() => {
    setSettings((prev) => ({ ...prev, isLoggedIn: true }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, loaded, updateSettings, completeOnboarding, resetOnboarding, logout, login }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
