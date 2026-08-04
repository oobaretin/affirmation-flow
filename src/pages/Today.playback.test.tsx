import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Route } from 'react-router-dom';
import { IonApp } from '@ionic/react';
import Today from './Today';
import { SettingsProvider } from '../hooks/useSettings';
import { CustomAffirmationsProvider } from '../hooks/useCustomAffirmations';
import { FavoritesProvider } from '../hooks/useFavorites';
import { resetTodayViewSession } from '../services/todayViewSession';
import * as voice from '../services/voice';

vi.mock('../hooks/useMinimumLoaderDuration', () => ({
  useMinimumLoaderDuration: (isLoading: boolean) => isLoading,
  LOADER_MIN_DURATION_MS: 0,
}));

vi.mock('../services/notifications', () => ({
  scheduleDailyNotification: vi.fn(),
}));

vi.mock('../services/elevenLabs', () => ({
  isElevenLabsConfigured: () => true,
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    useIonViewWillEnter: (callback: () => void) => {
      useEffect(() => {
        callback();
      }, [callback]);
    },
  };
});

function renderToday(voiceEnabled = true) {
  localStorage.setItem(
    'affirmation-flow-settings',
    JSON.stringify({
      name: 'Test',
      onboardingComplete: true,
      isLoggedIn: true,
      repeatMode: 'fixed',
      repeatCount: 3,
      voiceEnabled,
      voiceProvider: 'elevenlabs',
      notificationsEnabled: false,
      focusCategories: ['Calm'],
    }),
  );

  return render(
    <IonApp>
      <SettingsProvider>
        <CustomAffirmationsProvider>
          <FavoritesProvider>
            <MemoryRouter initialEntries={['/today']}>
              <Route path="/today">
                <Today />
              </Route>
            </MemoryRouter>
          </FavoritesProvider>
        </CustomAffirmationsProvider>
      </SettingsProvider>
    </IonApp>,
  );
}

describe('Today playback UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTodayViewSession();
  });

  it('shows listen CTA without repeat hint when voice is enabled', async () => {
    renderToday();
    expect(await screen.findByText('Listen now')).toBeInTheDocument();
    expect(screen.queryByText(/Repeat to yourself/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Speaks/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Stop Affirmation')).not.toBeInTheDocument();
  });

  it('shows stop while speech is in progress', async () => {
    vi.mocked(voice.speakAffirmation).mockImplementation(
      () => new Promise<void>(() => {
        /* never resolves — simulates in-progress playback */
      }),
    );

    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByText('Listen now'));

    await waitFor(() => {
      expect(screen.getByText('Stop Affirmation')).toBeInTheDocument();
    });
  });

  it('shows silent practice hint when voice is off', async () => {
    renderToday(false);
    expect(await screen.findByText(/^Begin today$/i)).toBeInTheDocument();
    expect(screen.getByText('Repeat to yourself 3x')).toBeInTheDocument();
  });

  it('hides stop after speech completes', async () => {
    vi.mocked(voice.speakAffirmation).mockImplementation(
      (_text, _count, onComplete) => {
        onComplete?.();
        return Promise.resolve(undefined);
      },
    );

    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByText('Listen now'));

    await waitFor(() => {
      expect(screen.queryByText('Stop Affirmation')).not.toBeInTheDocument();
    });
  });
});
