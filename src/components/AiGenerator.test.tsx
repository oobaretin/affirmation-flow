import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AiGenerator from './AiGenerator';
import { CATEGORIES } from '../data/affirmations';
import { SettingsProvider } from '../hooks/useSettings';

vi.mock('../services/aiAffirmations', () => ({
  generateAffirmations: vi.fn().mockResolvedValue({
    affirmations: [
      { text: 'I am worthy of success.', category: 'Self-Love' },
      { text: 'I trust my journey.', category: 'Confidence' },
      { text: 'I choose confidence today.', category: 'Confidence' },
    ],
    source: 'local',
  }),
}));

describe('AiGenerator save', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves selected affirmations with their categories via onSave', async () => {
    const onSave = vi.fn().mockReturnValue(3);
    const onCategoriesChange = vi.fn();
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <AiGenerator
          categories={['Self-Love', 'Confidence']}
          onCategoriesChange={onCategoriesChange}
          onSave={onSave}
        />
      </SettingsProvider>,
    );

    await user.click(screen.getByText('Generate Affirmations'));

    await waitFor(() => {
      expect(screen.getByText('Save 3 affirmations')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save 3 affirmations'));

    expect(onSave).toHaveBeenCalledWith([
      { text: 'I am worthy of success.', category: 'Self-Love' },
      { text: 'I trust my journey.', category: 'Confidence' },
      { text: 'I choose confidence today.', category: 'Confidence' },
    ]);
    expect(onSave.mock.results[0].value).toBe(3);
  });

  it('allows toggling multiple categories', async () => {
    const onCategoriesChange = vi.fn();
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <AiGenerator
          categories={['Self-Love']}
          onCategoriesChange={onCategoriesChange}
          onSave={vi.fn()}
        />
      </SettingsProvider>,
    );

    const chips = document.querySelectorAll('ion-chip');
    await user.click(chips[CATEGORIES.indexOf('Peace')]);

    expect(onCategoriesChange).toHaveBeenCalledWith(['Self-Love', 'Peace']);
  });
});
