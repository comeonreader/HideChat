export function createChatWebSocket(accessToken: string): WebSocket {
  const configuredUrl = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  const url = configuredUrl
    ? new URL(configuredUrl, window.location.origin)
    : new URL(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/chat`);
  url.searchParams.set("token", accessToken);
  return new WebSocket(url);
}
