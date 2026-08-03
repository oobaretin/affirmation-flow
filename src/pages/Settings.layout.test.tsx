import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Settings from './Settings';
import { SettingsProvider } from '../hooks/useSettings';
import { CustomAffirmationsProvider } from '../hooks/useCustomAffirmations';
import { FavoritesProvider } from '../hooks/useFavorites';
import { SubscriptionProvider } from '../hooks/useSubscription';

vi.mock('../services/notifications', () => ({
  scheduleDailyNotification: vi.fn(),
}));

vi.mock('../services/elevenLabs', () => ({
  isElevenLabsConfigured: () => true,
  listElevenLabsVoices: vi.fn().mockResolvedValue([]),
  getElevenLabsSubscription: vi.fn().mockResolvedValue(null),
  filterVoicesForApiAccess: (voices: unknown[]) => voices,
  pickDefaultApiVoice: (_voices: unknown[], _subscription: unknown, currentId: string) => currentId,
  getLastPremiumVoiceError: () => null,
}));

vi.mock('react-router-dom', () => ({
  useHistory: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe('Settings layout', () => {
  beforeEach(() => {
    localStorage.setItem(
      'affirmation-flow-settings',
      JSON.stringify({
        name: 'Test',
        onboardingComplete: true,
        isLoggedIn: true,
        repeatMode: 'fixed',
        repeatCount: 3,
        voiceEnabled: true,
        notificationsEnabled: true,
        notificationHour: 8,
        notificationMinute: 0,
        focusCategories: [],
      }),
    );
  });

  it('renders Log Out in the Account section', () => {
    render(
      <SettingsProvider>
        <CustomAffirmationsProvider>
          <FavoritesProvider>
            <SubscriptionProvider>
              <Settings />
            </SubscriptionProvider>
          </FavoritesProvider>
        </CustomAffirmationsProvider>
      </SettingsProvider>,
    );
    expect(screen.getByText('Lock App')).toBeInTheDocument();
    expect(screen.getByText('This Device')).toBeInTheDocument();
    expect(screen.getByText('Focus Areas')).toBeInTheDocument();
    expect(screen.getByText('Your Practice')).toBeInTheDocument();
  });
});
