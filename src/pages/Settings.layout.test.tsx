import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Settings from './Settings';
import { SettingsProvider } from '../hooks/useSettings';
import { CustomAffirmationsProvider } from '../hooks/useCustomAffirmations';
import { FavoritesProvider } from '../hooks/useFavorites';
import { SubscriptionProvider } from '../hooks/useSubscription';

vi.mock('../services/notifications', () => ({
  scheduleDailyNotification: vi.fn(),
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
        voiceStyle: 'soothing',
        elevenLabsVoiceId: '45UYeUCUrGxt4rWuj2Ir',
        notificationsEnabled: true,
        notificationHour: 8,
        notificationMinute: 0,
        focusCategories: [],
      }),
    );
  });

  it('renders a settings hub with drill-in rows and advanced actions tucked away', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsProvider>
          <CustomAffirmationsProvider>
            <FavoritesProvider>
              <SubscriptionProvider>
                <Settings />
              </SubscriptionProvider>
            </FavoritesProvider>
          </CustomAffirmationsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Your practice')).toBeInTheDocument();
    expect(container.querySelector('ion-input[label="Your name"]')).toBeTruthy();
    expect(container.querySelectorAll('.settings-menu-item')).toHaveLength(6);
    expect(screen.getByText('Your Practice')).toBeInTheDocument();
    expect(screen.queryByText('Preview Voice')).not.toBeInTheDocument();
    expect(screen.queryByText('Lock App')).not.toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Redo Onboarding')).toBeInTheDocument();
  });
});
