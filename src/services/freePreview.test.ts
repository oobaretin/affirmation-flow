import { describe, expect, it, beforeEach } from 'vitest';
import {
  consumeFreePreview,
  hasConsumedFreePreview,
  resetFreePreview,
} from './freePreview';

describe('freePreview', () => {
  beforeEach(() => {
    resetFreePreview();
  });

  it('starts unconsumed', () => {
    expect(hasConsumedFreePreview()).toBe(false);
  });

  it('marks preview as consumed', () => {
    consumeFreePreview();
    expect(hasConsumedFreePreview()).toBe(true);
  });
});
