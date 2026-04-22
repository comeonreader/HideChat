function normalizeBaseUrl(url: URL): string {
  return url.toString().replace(/\/$/, "");
}

function toWebSocketProtocol(protocol: string): string {
  if (protocol === "https:") {
    return "wss:";
  }
  if (protocol === "http:") {
    return "ws:";
  }
  return protocol;
}

export function resolveApiBaseUrl(
  configuredApiBaseUrl?: string,
  currentOrigin = window.location.origin
): string {
  if (configuredApiBaseUrl) {
    return normalizeBaseUrl(new URL(configuredApiBaseUrl, currentOrigin));
  }
  return normalizeBaseUrl(new URL("/api", currentOrigin));
}

export function resolveWebSocketBaseUrl(options?: {
  configuredApiBaseUrl?: string;
  configuredWsBaseUrl?: string;
  currentOrigin?: string;
}): string {
  const currentOrigin = options?.currentOrigin ?? window.location.origin;

  if (options?.configuredWsBaseUrl) {
    const configuredUrl = new URL(options.configuredWsBaseUrl, currentOrigin);
    configuredUrl.protocol = toWebSocketProtocol(configuredUrl.protocol);
    return normalizeBaseUrl(configuredUrl);
  }

  if (options?.configuredApiBaseUrl) {
    const apiUrl = new URL(options.configuredApiBaseUrl, currentOrigin);
    const wsUrl = new URL("/ws/chat", apiUrl.origin);
    wsUrl.protocol = toWebSocketProtocol(apiUrl.protocol);
    return normalizeBaseUrl(wsUrl);
  }

  const wsUrl = new URL("/ws/chat", currentOrigin);
  wsUrl.protocol = toWebSocketProtocol(wsUrl.protocol);
  return normalizeBaseUrl(wsUrl);
}
