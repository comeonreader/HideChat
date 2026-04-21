export interface ChatCacheState {
  hydrated: boolean;
  lastHydratedAt: number | null;
}

export function createChatCacheState(): ChatCacheState {
  return {
    hydrated: false,
    lastHydratedAt: null
  };
}

export function markChatCacheHydrated(now = Date.now()): ChatCacheState {
  return {
    hydrated: true,
    lastHydratedAt: now
  };
}

export function resetChatCacheState(): ChatCacheState {
  return createChatCacheState();
}

export function shouldRefreshChatCache(state: ChatCacheState, maxAgeMs: number, now = Date.now()): boolean {
  if (!state.hydrated || state.lastHydratedAt === null) {
    return true;
  }
  return now - state.lastHydratedAt > maxAgeMs;
}
