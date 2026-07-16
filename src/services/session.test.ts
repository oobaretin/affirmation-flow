import { describe, expect, it, beforeEach } from 'vitest';
import {
  EXPLICIT_LOGOUT_KEY,
  clearExplicitLogout,
  getLoggedOutDefaultRoute,
  hasExplicitLogout,
  markExplicitLogout,
} from './session';

describe('session logout routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('routes explicit logout to signed-out', () => {
    markExplicitLogout();
    expect(hasExplicitLogout()).toBe(true);
    expect(getLoggedOutDefaultRoute(hasExplicitLogout())).toBe('/signed-out');
  });

  it('routes cold start to welcome when no explicit logout flag', () => {
    expect(hasExplicitLogout()).toBe(false);
    expect(getLoggedOutDefaultRoute(hasExplicitLogout())).toBe('/welcome');
  });

  it('clears explicit logout flag on resume', () => {
    markExplicitLogout();
    clearExplicitLogout();
    expect(sessionStorage.getItem(EXPLICIT_LOGOUT_KEY)).toBeNull();
    expect(getLoggedOutDefaultRoute(hasExplicitLogout())).toBe('/welcome');
  });
});
