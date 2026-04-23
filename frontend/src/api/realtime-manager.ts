import { createChatWebSocket, createRealtimeEnvelope, sendEnvelope } from "./realtime";
import { getRealtimeStore, type RealtimeStore } from "../store/realtime-store";
import type { ConnectionState, RealtimeEnvelope, RealtimeStateSnapshot } from "../types";

type EnvelopeListener = (envelope: RealtimeEnvelope) => void;

interface RealtimeManagerDependencies {
  createSocket: (accessToken: string) => WebSocket;
  store: RealtimeStore;
  now: () => number;
}

const FOREGROUND_PING_INTERVAL_MS = 25_000;
const BACKGROUND_PING_INTERVAL_MS = 55_000;
const FOREGROUND_PONG_TIMEOUT_MS = FOREGROUND_PING_INTERVAL_MS * 2;
const BACKGROUND_PONG_TIMEOUT_MS = 20_000;
const MAX_RETRY_DELAY_MS = 15_000;
const AUTH_TIMEOUT_MS = 10_000;

export class RealtimeConnectionManager {
  private readonly envelopeListeners = new Set<EnvelopeListener>();
  private readonly handleOnline = () => {
    this.dependencies.store.markOnline(true);
    if (!this.manualClose) {
      this.connect(this.accessToken);
    }
  };
  private readonly handleOffline = () => {
    this.dependencies.store.markOnline(false);
    this.closeSocket(false);
  };
  private readonly handleVisibilityChange = () => {
    const isForeground = document.visibilityState !== "hidden";
    this.dependencies.store.markForeground(isForeground);
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.scheduleHeartbeat();
      return;
    }
    if (isForeground && !this.manualClose && this.accessToken) {
      this.connect(this.accessToken);
    }
  };

  private accessToken: string | null = null;
  private socket: WebSocket | null = null;
  private heartbeatTimer: number | null = null;
  private pongTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private retryCount = 0;
  private manualClose = false;
  private listenersBound = false;
  private authTimer: number | null = null;

  constructor(private readonly dependencies: RealtimeManagerDependencies) {}

  connect(accessToken: string | null | undefined): void {
    this.bindBrowserListeners();
    this.accessToken = accessToken ?? null;
    if (!this.accessToken) {
      this.disconnect();
      return;
    }

    const snapshot = this.dependencies.store.getSnapshot();
    if (!snapshot.isOnline) {
      this.dependencies.store.markConnectionState("offline");
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.manualClose = false;
    this.clearReconnectTimer();
    this.transitionState(this.retryCount > 0 ? "reconnecting" : "connecting");

    const socket = this.dependencies.createSocket(this.accessToken);
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) {
        socket.close();
        return;
      }
      this.transitionState("authenticating");
      const authenticated = sendEnvelope(
        socket,
        createRealtimeEnvelope("auth", {
          accessToken: this.accessToken
        })
      );
      if (!authenticated) {
        this.scheduleReconnect();
        return;
      }
      this.scheduleAuthTimeout();
    };

    socket.onmessage = (event) => {
      const envelope = this.parseEnvelope(event.data);
      if (!envelope) {
        return;
      }
      if (this.isAuthOkEnvelope(envelope)) {
        this.retryCount = 0;
        this.clearAuthTimer();
        this.dependencies.store.markConnected(this.dependencies.now());
        this.scheduleHeartbeat();
        return;
      }
      if (this.isPongEnvelope(envelope)) {
        this.dependencies.store.markPong(this.dependencies.now());
        this.clearPongTimer();
        return;
      }
      this.envelopeListeners.forEach((listener) => listener(envelope));
    };

    socket.onerror = () => {
      this.transitionState("error");
    };

    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = null;
      }
      this.clearHeartbeatTimers();
      this.clearAuthTimer();
      if (this.manualClose || !this.accessToken) {
        this.transitionState("closed");
        return;
      }
      if (!this.dependencies.store.getSnapshot().isOnline) {
        this.transitionState("offline");
        return;
      }
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.manualClose = true;
    this.accessToken = null;
    this.transitionState("closing");
    this.clearReconnectTimer();
    this.closeSocket(true);
    this.dependencies.store.markConnectionState("closed");
  }

  send(payload: unknown): boolean {
    const socket = this.socket;
    if (!socket) {
      return false;
    }
    return sendEnvelope(socket, payload);
  }

  subscribeToMessages(listener: EnvelopeListener): () => void {
    this.envelopeListeners.add(listener);
    return () => {
      this.envelopeListeners.delete(listener);
    };
  }

  subscribeToState(listener: (snapshot: RealtimeStateSnapshot) => void): () => void {
    return this.dependencies.store.subscribe(listener);
  }

  reset(): void {
    this.disconnect();
    this.dependencies.store.reset();
  }

  private transitionState(state: ConnectionState): void {
    this.dependencies.store.markConnectionState(state);
  }

  private scheduleHeartbeat(): void {
    this.clearHeartbeatTimers();
    const snapshot = this.dependencies.store.getSnapshot();
    const intervalMs = snapshot.isForeground ? FOREGROUND_PING_INTERVAL_MS : BACKGROUND_PING_INTERVAL_MS;
    const pongTimeoutMs = snapshot.isForeground ? FOREGROUND_PONG_TIMEOUT_MS : BACKGROUND_PONG_TIMEOUT_MS;

    this.heartbeatTimer = window.setTimeout(() => {
      const sent = this.send({
        type: "ping",
        data: {
          clientTime: this.dependencies.now()
        }
      });
      if (!sent) {
        this.scheduleReconnect();
        return;
      }
      this.pongTimer = window.setTimeout(() => {
        this.closeSocket(false);
      }, pongTimeoutMs);
      this.scheduleHeartbeat();
    }, intervalMs);
  }

  private scheduleReconnect(): void {
    if (this.manualClose || !this.accessToken || this.reconnectTimer !== null) {
      return;
    }
    this.retryCount += 1;
    this.dependencies.store.markRetry(this.retryCount);
    const reconnectDelayMs = this.calculateRetryDelay(this.retryCount);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.accessToken);
    }, reconnectDelayMs);
  }

  private calculateRetryDelay(retryCount: number): number {
    const cappedBaseDelay = retryCount <= 1 ? 1_000 : Math.min(2 ** (retryCount - 1) * 1_000, MAX_RETRY_DELAY_MS);
    const jitter = Math.round(cappedBaseDelay * Math.random() * 0.2);
    return cappedBaseDelay + jitter;
  }

  private closeSocket(manualClose: boolean): void {
    this.clearHeartbeatTimers();
    this.clearAuthTimer();
    const socket = this.socket;
    this.socket = null;
    if (!socket) {
      return;
    }
    this.manualClose = manualClose;
    if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
      return;
    }
    socket.close();
  }

  private parseEnvelope(raw: string): RealtimeEnvelope | null {
    try {
      return JSON.parse(raw) as RealtimeEnvelope;
    } catch {
      return null;
    }
  }

  private isPongEnvelope(envelope: RealtimeEnvelope): boolean {
    return envelope.type === "PONG" || envelope.type === "pong";
  }

  private isAuthOkEnvelope(envelope: RealtimeEnvelope): boolean {
    return envelope.type === "auth_ok";
  }

  private scheduleAuthTimeout(): void {
    this.clearAuthTimer();
    this.authTimer = window.setTimeout(() => {
      this.closeSocket(false);
    }, AUTH_TIMEOUT_MS);
  }

  private bindBrowserListeners(): void {
    if (this.listenersBound || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.listenersBound = true;
  }

  private clearHeartbeatTimers(): void {
    if (this.heartbeatTimer !== null) {
      window.clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearPongTimer();
  }

  private clearPongTimer(): void {
    if (this.pongTimer !== null) {
      window.clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearAuthTimer(): void {
    if (this.authTimer !== null) {
      window.clearTimeout(this.authTimer);
      this.authTimer = null;
    }
  }

}

let realtimeManagerSingleton: RealtimeConnectionManager | null = null;

export function getRealtimeConnectionManager(): RealtimeConnectionManager {
  if (!realtimeManagerSingleton) {
    realtimeManagerSingleton = new RealtimeConnectionManager({
      createSocket: createChatWebSocket,
      store: getRealtimeStore(),
      now: () => Date.now()
    });
  }
  return realtimeManagerSingleton;
}
