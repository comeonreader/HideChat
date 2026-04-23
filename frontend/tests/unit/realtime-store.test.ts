import { describe, expect, it } from "vitest";
import { RealtimeStore } from "../../src/store/realtime-store";

describe("realtime store", () => {
  it("tracks connection and heartbeat state", () => {
    const store = new RealtimeStore();

    store.markConnectionState("connecting");
    store.markConnected(1_000);
    store.markPong(1_500);
    store.markRetry(2);
    store.markOnline(false);
    store.markForeground(false);
    store.setSyncCursor("cursor_1");

    expect(store.getSnapshot()).toEqual({
      connectionState: "offline",
      lastConnectedAt: 1_000,
      lastPongAt: 1_500,
      retryCount: 2,
      isOnline: false,
      isForeground: false,
      syncCursor: "cursor_1"
    });
  });

  it("resets to a clean snapshot", () => {
    const store = new RealtimeStore();

    store.markConnected(1_000);
    store.markPong(1_500);
    store.markRetry(3);
    store.setSyncCursor("cursor_2");
    store.reset();

    expect(store.getSnapshot()).toEqual({
      connectionState: "idle",
      lastConnectedAt: null,
      lastPongAt: null,
      retryCount: 0,
      isOnline: true,
      isForeground: true,
      syncCursor: null
    });
  });
});
