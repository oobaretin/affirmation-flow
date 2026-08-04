import { describe, expect, it, beforeEach, vi } from 'vitest';
import { clearAllAppData, STORAGE_KEYS } from './session';

vi.mock('./notifications', () => ({
  cancelDailyNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./voice', () => ({
  stopSpeaking: vi.fn(),
}));

describe('clearAllAppData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes all app storage keys', async () => {
    STORAGE_KEYS.forEach((key) => localStorage.setItem(key, 'test'));
    await clearAllAppData();
    STORAGE_KEYS.forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull();
    });
  });
});
