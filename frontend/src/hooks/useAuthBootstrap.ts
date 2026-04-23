import { useEffect } from "react";
import { fetchCurrentUser, getPersistedAuthTokens } from "../api/client";
import type { LocalUser } from "../types";

interface UseAuthBootstrapOptions {
  onAuthenticated: (user: LocalUser, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => Promise<void>;
}

export function useAuthBootstrap({ onAuthenticated }: UseAuthBootstrapOptions): void {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const persistedTokens = getPersistedAuthTokens();
      if (!persistedTokens) {
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (cancelled) {
          return;
        }
        await onAuthenticated(currentUser, persistedTokens);
      } catch {
        // Ignore bootstrap errors so the disguise flow remains primary.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onAuthenticated]);
}
