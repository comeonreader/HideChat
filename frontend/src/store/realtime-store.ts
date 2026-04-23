import type { ConnectionState, RealtimeStateSnapshot } from "../types";

type RealtimeStoreListener = (snapshot: RealtimeStateSnapshot) => void;

const DEFAULT_STATE: RealtimeStateSnapshot = {
  connectionState: "idle",
  lastConnectedAt: null,
  lastPongAt: null,
  retryCount: 0,
  isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
  isForeground: typeof document === "undefined" ? true : document.visibilityState !== "hidden",
  syncCursor: null
};

export class RealtimeStore {
  private state: RealtimeStateSnapshot = DEFAULT_STATE;
  private listeners = new Set<RealtimeStoreListener>();

  getSnapshot(): RealtimeStateSnapshot {
    return this.state;
  }

  subscribe(listener: RealtimeStoreListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(): void {
    this.setState({
      ...DEFAULT_STATE,
      isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
      isForeground: typeof document === "undefined" ? true : document.visibilityState !== "hidden"
    });
  }

  markConnectionState(connectionState: ConnectionState): void {
    this.setState({ connectionState });
  }

  markConnected(at = Date.now()): void {
    this.setState({
      connectionState: "connected",
      lastConnectedAt: at,
      retryCount: 0
    });
  }

  markPong(at = Date.now()): void {
    this.setState({
      lastPongAt: at
    });
  }

  markRetry(retryCount: number): void {
    this.setState({
      connectionState: "reconnecting",
      retryCount
    });
  }

  markOnline(isOnline: boolean): void {
    this.setState({
      isOnline,
      connectionState: isOnline ? this.state.connectionState : "offline"
    });
  }

  markForeground(isForeground: boolean): void {
    this.setState({ isForeground });
  }

  setSyncCursor(syncCursor: string | null): void {
    this.setState({ syncCursor });
  }

  private setState(patch: Partial<RealtimeStateSnapshot>): void {
    this.state = {
      ...this.state,
      ...patch
    };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

let realtimeStoreSingleton: RealtimeStore | null = null;

export function getRealtimeStore(): RealtimeStore {
  if (!realtimeStoreSingleton) {
    realtimeStoreSingleton = new RealtimeStore();
  }
  return realtimeStoreSingleton;
}
