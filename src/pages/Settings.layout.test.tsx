import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Settings from './Settings';
import { SettingsProvider } from '../hooks/useSettings';

vi.mock('../services/notifications', () => ({
  scheduleDailyNotification: vi.fn(),
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
        <Settings />
      </SettingsProvider>,
    );
    expect(screen.getByText('Lock App')).toBeInTheDocument();
    expect(screen.getByText('This Device')).toBeInTheDocument();
    expect(screen.getByText('Focus Areas')).toBeInTheDocument();
    expect(screen.getByText('Your Practice')).toBeInTheDocument();
  });
});
