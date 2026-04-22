import { resolveWebSocketBaseUrl } from "./network";

export function createChatWebSocket(accessToken: string): WebSocket {
  const url = new URL(
    resolveWebSocketBaseUrl({
      configuredApiBaseUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
      configuredWsBaseUrl: import.meta.env.VITE_WS_BASE_URL as string | undefined
    })
  );
  url.searchParams.set("token", accessToken);
  return new WebSocket(url);
}
