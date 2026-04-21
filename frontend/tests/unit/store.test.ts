import { describe, expect, it } from "vitest";
import {
  createChatCacheState,
  markChatCacheHydrated,
  resetChatCacheState,
  shouldRefreshChatCache
} from "../../src/store";

describe("store", () => {
  it("creates an empty chat cache state", () => {
    expect(createChatCacheState()).toEqual({
      hydrated: false,
      lastHydratedAt: null
    });
  });

  it("marks chat cache as hydrated", () => {
    expect(markChatCacheHydrated(1_000)).toEqual({
      hydrated: true,
      lastHydratedAt: 1_000
    });
  });

  it("resets chat cache state", () => {
    const hydrated = markChatCacheHydrated(2_000);
    expect(resetChatCacheState()).toEqual({
      hydrated: false,
      lastHydratedAt: null
    });
    expect(hydrated.hydrated).toBe(true);
  });

  it("requests refresh before first hydration", () => {
    expect(shouldRefreshChatCache(createChatCacheState(), 30_000, 10_000)).toBe(true);
  });

  it("does not refresh hydrated cache within max age", () => {
    const state = markChatCacheHydrated(10_000);
    expect(shouldRefreshChatCache(state, 30_000, 20_000)).toBe(false);
  });

  it("refreshes hydrated cache after max age", () => {
    const state = markChatCacheHydrated(10_000);
    expect(shouldRefreshChatCache(state, 30_000, 50_100)).toBe(true);
  });
});
