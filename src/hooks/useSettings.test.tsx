import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider, useSettings } from './useSettings';

function Probe() {
  const { settings, completeOnboarding } = useSettings();
  return (
    <>
      <span data-testid="complete">{String(settings.onboardingComplete)}</span>
      <span data-testid="name">{settings.name}</span>
      <button type="button" onClick={() => completeOnboarding({ name: 'TestUser' })}>
        finish
      </button>
    </>
  );
}

describe('SettingsProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shares onboarding completion across consumers', async () => {
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    expect(screen.getByTestId('complete').textContent).toBe('false');
    await user.click(screen.getByRole('button', { name: 'finish' }));
    expect(screen.getByTestId('complete').textContent).toBe('true');
    expect(screen.getByTestId('name').textContent).toBe('TestUser');
    expect(localStorage.getItem('affirmation-flow-settings')).toContain('TestUser');
  });
});
