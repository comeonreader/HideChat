import type { AuthTokens } from "../types";

export const AUTH_STORAGE_KEY = "hidechat-auth";

interface StoredAuthState {
  accessToken: string;
  refreshToken: string;
}

export function getStoredAuthState(): StoredAuthState | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthState) : null;
  } catch {
    return null;
  }
}

export function getPersistedAuthTokens(): AuthTokens | null {
  const authState = getStoredAuthState();
  if (!authState) {
    return null;
  }
  return {
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    expiresIn: 0
  };
}

export function saveStoredAuthState(tokens: AuthTokens): void {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    } satisfies StoredAuthState)
  );
}

export function clearStoredAuthState(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
