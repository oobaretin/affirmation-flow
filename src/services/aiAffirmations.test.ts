import { describe, expect, it } from 'vitest';
import { generateAffirmations, generateNextAffirmation } from './aiAffirmations';

describe('generateAffirmations', () => {
  it('generates local affirmations with category tags', async () => {
    const result = await generateAffirmations({
      categories: ['Confidence', 'Peace'],
      count: 4,
    });

    expect(result.affirmations).toHaveLength(4);
    expect(result.source).toBe('local');
    result.affirmations.forEach((affirmation) => {
      expect(['Confidence', 'Peace']).toContain(affirmation.category);
      expect(affirmation.text.length).toBeGreaterThan(0);
    });
  });

  it('uses default category when none are provided', async () => {
    const result = await generateAffirmations({
      categories: [],
      count: 2,
    });

    expect(result.affirmations).toHaveLength(2);
    result.affirmations.forEach((affirmation) => {
      expect(affirmation.category).toBe('Self-Love');
    });
  });
});

describe('generateNextAffirmation', () => {
  it('returns a single affirmation from the selected focus categories', async () => {
    const affirmation = await generateNextAffirmation(['Gratitude', 'Health']);

    expect(affirmation.id).toMatch(/^ai-/);
    expect(['Gratitude', 'Health']).toContain(affirmation.category);
    expect(affirmation.text.length).toBeGreaterThan(0);
  });
});
