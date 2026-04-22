import type { ApiErrorPayload, AuthTokens } from "../types";
import { clearStoredAuthState, getStoredAuthState } from "./auth-storage";
import { resolveApiBaseUrl } from "./network";

const baseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

let refreshAuthTokens: (() => Promise<AuthTokens>) | null = null;

export class ApiError extends Error {
  readonly code?: number;
  readonly status?: number;
  readonly isNetworkError: boolean;

  constructor(message: string, options?: { code?: number; status?: number; isNetworkError?: boolean }) {
    super(message);
    this.name = "ApiError";
    this.code = options?.code;
    this.status = options?.status;
    this.isNetworkError = options?.isNetworkError ?? false;
  }
}

export function setAuthTokenRefresher(refresher: (() => Promise<AuthTokens>) | null): void {
  refreshAuthTokens = refresher;
}

function isUnauthorized(status: number, code?: number): boolean {
  return status === 401 || code === 401001;
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
  requiresAuth = false,
  allowRefresh = true
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const authState = getStoredAuthState();
    if (!authState?.accessToken) {
      throw new ApiError("缺少登录态", { status: 401 });
    }
    headers.set("Authorization", `Bearer ${authState.accessToken}`);
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers
    });

    const isJson = response.headers.get("Content-Type")?.includes("application/json");
    const payload = isJson ? ((await response.json()) as ApiEnvelope<T> | ApiErrorPayload) : null;

    if (!response.ok) {
      const apiPayload = payload as ApiErrorPayload | null;
      if (requiresAuth && allowRefresh && refreshAuthTokens && isUnauthorized(response.status, apiPayload?.code)) {
        try {
          await refreshAuthTokens();
        } catch {
          clearStoredAuthState();
          throw new ApiError("登录状态已失效，请重新登录", { status: 401 });
        }
        return requestJson<T>(path, init, requiresAuth, false);
      }
      throw new ApiError((payload as ApiErrorPayload | null)?.message ?? "请求失败", {
        code: apiPayload?.code,
        status: response.status
      });
    }

    const envelope = payload as ApiEnvelope<T>;
    if (typeof envelope?.code === "number" && envelope.code !== 0) {
      if (requiresAuth && allowRefresh && refreshAuthTokens && isUnauthorized(response.status, envelope.code)) {
        try {
          await refreshAuthTokens();
        } catch {
          clearStoredAuthState();
          throw new ApiError("登录状态已失效，请重新登录", { status: 401 });
        }
        return requestJson<T>(path, init, requiresAuth, false);
      }
      throw new ApiError(envelope.message || "请求失败", {
        code: envelope.code,
        status: response.status
      });
    }

    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("后端不可用，请检查网络连接", { isNetworkError: true });
  }
}

export async function requestWithoutEnvelope(input: string, init?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      let message = "请求失败";
      const isJson = response.headers.get("Content-Type")?.includes("application/json");
      if (isJson) {
        const payload = (await response.json()) as ApiErrorPayload;
        message = payload.message ?? message;
      }
      throw new ApiError(message, { status: response.status });
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("上传失败，请检查网络连接", { isNetworkError: true });
  }
}

export async function readJsonWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    return await requestJson<T>(path);
  } catch {
    return fallback;
  }
}

export function resolveUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, window.location.origin).toString();
}
