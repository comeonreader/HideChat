import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl, resolveWebSocketBaseUrl } from "../../src/api/network";

describe("network endpoint resolution", () => {
  it("uses the current origin for the default api base url", () => {
    expect(resolveApiBaseUrl(undefined, "http://192.168.1.20:5173")).toBe("http://192.168.1.20:5173/api");
  });

  it("resolves relative configured api base urls against the current origin", () => {
    expect(resolveApiBaseUrl("/backend-api", "http://10.0.0.8:5173")).toBe("http://10.0.0.8:5173/backend-api");
  });

  it("derives websocket endpoint from the configured api host when ws is not configured", () => {
    expect(
      resolveWebSocketBaseUrl({
        configuredApiBaseUrl: "https://192.168.1.30:8080/api"
      })
    ).toBe("wss://192.168.1.30:8080/ws/chat");
  });

  it("prefers an explicitly configured websocket base url", () => {
    expect(
      resolveWebSocketBaseUrl({
        configuredApiBaseUrl: "http://192.168.1.30:8080/api",
        configuredWsBaseUrl: "ws://192.168.1.40:18080/ws/chat"
      })
    ).toBe("ws://192.168.1.40:18080/ws/chat");
  });

  it("falls back to the current origin for websocket connections", () => {
    expect(
      resolveWebSocketBaseUrl({
        currentOrigin: "http://172.20.10.5:5173"
      })
    ).toBe("ws://172.20.10.5:5173/ws/chat");
  });
});
