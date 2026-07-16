import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AiGenerator from './AiGenerator';
import { SettingsProvider } from '../hooks/useSettings';

vi.mock('../services/aiAffirmations', () => ({
  generateAffirmations: vi.fn().mockResolvedValue({
    affirmations: [
      'I am worthy of success.',
      'I trust my journey.',
      'I choose confidence today.',
    ],
    source: 'local',
  }),
}));

describe('AiGenerator save', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves selected affirmations to library via onSave', async () => {
    const onSave = vi.fn().mockReturnValue(3);
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <AiGenerator onSave={onSave} />
      </SettingsProvider>,
    );

    await user.click(screen.getByText('Generate Affirmations'));

    await waitFor(() => {
      expect(screen.getByText('Save 3 to Library')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save 3 to Library'));

    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ text: 'I am worthy of success.', category: 'Self-Love' }),
      ]),
    );
    expect(onSave.mock.results[0].value).toBe(3);
  });
});
