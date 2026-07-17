import { describe, expect, it } from 'vitest';
import { isSubscriptionDevBypass } from './subscription';

describe('subscription', () => {
  it('enables bypass in test mode', () => {
    expect(isSubscriptionDevBypass()).toBe(true);
  });
});
