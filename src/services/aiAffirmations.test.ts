import { describe, expect, it } from 'vitest';
import { generateAffirmations } from './aiAffirmations';

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
      expect(affirmation.text).not.toContain('Alex');
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
