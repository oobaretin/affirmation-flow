import { describe, expect, it } from 'vitest';
import { AFFIRMATIONS, filterByFocus, getDailyAffirmation } from './affirmations';

describe('affirmation selection', () => {
  it('filters pool by focus categories', () => {
    const filtered = filterByFocus(AFFIRMATIONS, ['Peace']);
    expect(filtered.every((item) => item.category === 'Peace')).toBe(true);
    expect(filtered.length).toBe(10);
  });

  it('falls back to full pool when focus filter is empty', () => {
    expect(filterByFocus(AFFIRMATIONS, [])).toHaveLength(AFFIRMATIONS.length);
  });

  it('uses pinned affirmation for today when provided', () => {
    const pinned = AFFIRMATIONS[0];
    const daily = getDailyAffirmation([], ['Confidence'], pinned);
    expect(daily.id).toBe(pinned.id);
  });

  it('respects focus categories for daily selection', () => {
    const daily = getDailyAffirmation([], ['Health']);
    expect(daily.category).toBe('Health');
  });

  it('includes custom affirmations in daily selection', () => {
    const custom = [{ id: 'custom-1', text: 'My personal mantra.', category: 'Custom' }];
    const daily = getDailyAffirmation(custom, ['Peace']);
    expect(['Peace', 'Custom']).toContain(daily.category);
  });
});
