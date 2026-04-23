import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeConnectionManager } from "../../src/api/realtime-manager";
import { RealtimeStore } from "../../src/store/realtime-store";

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  sentMessages: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  emitMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  send(message: string) {
    this.sentMessages.push(message);
  }
}

describe("realtime connection manager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("connects once and sends heartbeat ping", () => {
    const store = new RealtimeStore();
    const sockets: MockWebSocket[] = [];
    const manager = new RealtimeConnectionManager({
      createSocket: () => {
        const socket = new MockWebSocket();
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      store,
      now: () => 1_000
    });

    manager.connect("token_a");
    expect(store.getSnapshot().connectionState).toBe("connecting");
    expect(sockets).toHaveLength(1);

    sockets[0].open();
    expect(store.getSnapshot().connectionState).toBe("authenticating");
    expect(JSON.parse(sockets[0].sentMessages[0])).toMatchObject({
      type: "auth",
      data: {
        accessToken: "token_a"
      }
    });

    sockets[0].emitMessage({ type: "auth_ok", data: { userUid: "u_1001" } });
    expect(store.getSnapshot().connectionState).toBe("connected");
    expect(store.getSnapshot().lastConnectedAt).toBe(1_000);

    vi.advanceTimersByTime(25_000);
    expect(sockets[0].sentMessages).toHaveLength(2);
    expect(JSON.parse(sockets[0].sentMessages[1])).toMatchObject({
      type: "ping",
      data: {
        clientTime: 1_000
      }
    });
  });

  it("marks pong receipt without leaking it to message subscribers", () => {
    const store = new RealtimeStore();
    const socket = new MockWebSocket();
    const manager = new RealtimeConnectionManager({
      createSocket: () => socket as unknown as WebSocket,
      store,
      now: () => 2_000
    });
    const messages: unknown[] = [];

    manager.subscribeToMessages((message) => {
      messages.push(message);
    });
    manager.connect("token_a");
    socket.open();
    socket.emitMessage({ type: "auth_ok", data: { userUid: "u_1001" } });
    socket.emitMessage({ type: "PONG", data: { serverTime: 2_000 } });

    expect(store.getSnapshot().lastPongAt).toBe(2_000);
    expect(messages).toEqual([]);
  });

  it("reconnects after unexpected close", () => {
    const store = new RealtimeStore();
    const sockets: MockWebSocket[] = [];
    const manager = new RealtimeConnectionManager({
      createSocket: () => {
        const socket = new MockWebSocket();
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      store,
      now: () => 3_000
    });

    manager.connect("token_a");
    sockets[0].open();
    sockets[0].emitMessage({ type: "auth_ok", data: { userUid: "u_1001" } });
    sockets[0].close();

    expect(store.getSnapshot().connectionState).toBe("reconnecting");
    expect(store.getSnapshot().retryCount).toBe(1);

    vi.advanceTimersByTime(1_200);
    expect(sockets).toHaveLength(2);
  });
});
