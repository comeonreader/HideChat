import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveStoredAuthState } from "../../src/api/auth-storage";
import { ApiError, requestJson, setAuthTokenRefresher } from "../../src/api/http";

describe("http", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setAuthTokenRefresher(null);
  });

  it("retries an authenticated request after refreshing the token", async () => {
    saveStoredAuthState({
      accessToken: "expired-access",
      refreshToken: "refresh-token",
      expiresIn: 3600
    });

    const refresher = vi.fn(async () => {
      saveStoredAuthState({
        accessToken: "next-access",
        refreshToken: "refresh-token",
        expiresIn: 3600
      });
      return {
        accessToken: "next-access",
        refreshToken: "refresh-token",
        expiresIn: 3600
      };
    });
    setAuthTokenRefresher(refresher);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 401001, message: "token expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 0, data: { ok: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson<{ ok: boolean }>("/protected", { method: "GET" }, true)).resolves.toEqual({ ok: true });
    expect(refresher).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const retryHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe("Bearer next-access");
  });

  it("throws ApiError when no persisted token exists for an authenticated request", async () => {
    await expect(requestJson("/protected", { method: "GET" }, true)).rejects.toMatchObject({
      message: "缺少登录态",
      status: 401
    } satisfies Partial<ApiError>);
  });

  it("maps network failures to ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(requestJson("/system/fortune/today")).rejects.toMatchObject({
      message: "后端不可用，请检查网络连接",
      isNetworkError: true
    } satisfies Partial<ApiError>);
  });
});
