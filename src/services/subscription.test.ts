import { describe, expect, it } from 'vitest';
import { buildSubscriptionLegal } from '../constants/subscription';
import { formatPlanTrialNote, isSubscriptionDevBypass } from './subscription';

describe('subscription', () => {
  it('enables bypass in test mode', () => {
    expect(isSubscriptionDevBypass()).toBe(true);
  });

  it('formats plan trial note with fallback pricing', () => {
    expect(formatPlanTrialNote('monthly', null)).toBe('7-day free trial, then $4.99/month');
    expect(formatPlanTrialNote('yearly', null)).toBe('7-day free trial, then $39.99/year');
  });

  it('builds legal copy for the selected plan', () => {
    expect(buildSubscriptionLegal('yearly', '$39.99')).toContain('7-day free trial');
    expect(buildSubscriptionLegal('yearly', '$39.99')).toContain('$39.99/year');
  });
});
