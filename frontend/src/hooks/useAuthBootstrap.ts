import { useEffect } from "react";
import { fetchCurrentUser, getPersistedAuthTokens } from "../api/client";
import type { LocalUser } from "../types";

interface UseAuthBootstrapOptions {
  onAuthenticated: (user: LocalUser, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => Promise<void>;
  onStatusChange: (status: string) => void;
}

export function useAuthBootstrap({
  onAuthenticated,
  onStatusChange
}: UseAuthBootstrapOptions): void {
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
        if (!cancelled) {
          onStatusChange("检测到本地登录态，输入幸运数字后可直接进入聊天。");
        }
      } catch {
        // Ignore bootstrap errors so the disguise flow remains primary.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onAuthenticated, onStatusChange]);
}
