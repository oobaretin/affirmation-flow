import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';

vi.mock('./hooks/useMinimumLoaderDuration', () => ({
  useMinimumLoaderDuration: (isLoading: boolean) => isLoading,
  LOADER_MIN_DURATION_MS: 0,
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    schedule: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn() },
  ImpactStyle: { Medium: 'MEDIUM' },
}));

describe('App onboarding flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('completes the three-step onboarding and shows Today tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    const focusCheckbox = document.querySelector('ion-checkbox');
    expect(focusCheckbox).toBeTruthy();
    await user.click(focusCheckbox!);
    await user.click(screen.getByText('Continue'));

    await user.click(screen.getByText('Continue'));

    await user.click(screen.getByText('Start My Journey'));

    await waitFor(() => {
      expect(document.querySelector('ion-tab-bar')).toBeTruthy();
    });

    expect(localStorage.getItem('affirmation-flow-settings')).toContain('"onboardingComplete":true');
  });
});
