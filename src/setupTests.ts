// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import { vi } from 'vitest';

vi.mock('./services/voice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/voice')>();
  return {
    ...actual,
    speakAffirmation: vi.fn().mockResolvedValue(undefined),
    previewVoice: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock matchmedia
window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};
