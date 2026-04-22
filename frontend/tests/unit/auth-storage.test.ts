import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_STORAGE_KEY,
  clearStoredAuthState,
  getPersistedAuthTokens,
  getStoredAuthState,
  saveStoredAuthState
} from "../../src/api/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists and restores auth tokens without changing storage shape", () => {
    saveStoredAuthState({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 7200
    });

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBe(
      JSON.stringify({
        accessToken: "access-token",
        refreshToken: "refresh-token"
      })
    );
    expect(getStoredAuthState()).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });
    expect(getPersistedAuthTokens()).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 0
    });
  });

  it("clears persisted auth state", () => {
    saveStoredAuthState({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 7200
    });

    clearStoredAuthState();

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(getPersistedAuthTokens()).toBeNull();
  });
});
