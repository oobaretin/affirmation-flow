import { describe, expect, it, vi } from 'vitest';
import { getTimeAwareGreeting } from './greeting';

describe('getTimeAwareGreeting', () => {
  it('includes the name when provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-04T09:00:00'));

    expect(getTimeAwareGreeting('Alex')).toBe('Good morning, Alex');

    vi.useRealTimers();
  });

  it('falls back to Today when name is empty', () => {
    expect(getTimeAwareGreeting('   ')).toBe('Today');
  });
});
