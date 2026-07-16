import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';

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

  it('completes onboarding and shows Today tab after Start My Journey', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nameInput = await screen.findByLabelText(/your name/i);
    await user.type(nameInput, 'TestUser');

    await user.click(screen.getByText('Continue'));
    await user.click(screen.getByText('Continue'));
    await user.click(screen.getByText('Continue'));

    await user.click(screen.getByText('Start My Journey'));

    await waitFor(() => {
      expect(screen.getAllByText(/hello, testuser/i).length).toBeGreaterThan(0);
    });

    expect(document.querySelector('ion-tab-bar')).toBeTruthy();
    expect(localStorage.getItem('affirmation-flow-settings')).toContain('"onboardingComplete":true');
  });
});
