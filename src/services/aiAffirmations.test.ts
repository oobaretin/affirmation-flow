import { describe, expect, it } from 'vitest';
import { generateAffirmations } from './aiAffirmations';

describe('generateAffirmations', () => {
  it('generates local affirmations from categories and intention', async () => {
    const result = await generateAffirmations({
      categories: ['Confidence'],
      intention: 'public speaking',
      count: 3,
    });

    expect(result.affirmations).toHaveLength(3);
    expect(result.source).toBe('local');
    expect(result.affirmations[0]).toMatch(/^I /);
    expect(result.affirmations[0]).not.toContain('Alex');
  });
});
