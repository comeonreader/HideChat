import type {
  ApiErrorPayload,
  AuthTokens,
  ChatMessage,
  ContactItem,
  ConversationItem,
  DisguiseConfig,
  FileInfo,
  FortuneToday,
  LuckyNumberVerifyResult,
  LocalUser,
  RecentContactItem,
  UserSearchItem
} from "../types";

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
const AUTH_STORAGE_KEY = "hidechat-auth";

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

interface StoredAuthState {
  accessToken: string;
  refreshToken: string;
}

interface AuthUserInfo {
  userUid: string;
  nickname: string;
  avatarUrl?: string | null;
}

interface UserProfileResponse {
  userUid: string;
  displayUserId: string;
  nickname: string;
  avatarUrl?: string | null;
}

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: AuthUserInfo;
}

interface MessageHistoryResponse {
  list: Array<{
    messageId: string;
    conversationId: string;
    senderUid: string;
    receiverUid: string;
    messageType: string;
    payloadType?: string;
    payload: string;
    fileId?: string | null;
    clientMsgTime?: number | null;
    serverMsgTime: number;
    serverStatus?: string;
  }>;
  nextCursor?: string | null;
  hasMore: boolean;
}

interface FileUploadSignResponse {
  fileId: string;
  uploadUrl: string;
  storageKey: string;
  headers?: Record<string, string>;
}

let refreshPromise: Promise<AuthTokens> | null = null;

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

function mapUserInfoToLocalUser(userInfo: AuthUserInfo, email: string): LocalUser {
  return {
    userUid: userInfo.userUid,
    nickname: userInfo.nickname,
    email,
    avatarUrl: userInfo.avatarUrl
  };
}

function mapTokenResponse(token: AuthTokenResponse): AuthTokens {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresIn: token.expiresIn
  };
}

function mapMessage(message: MessageHistoryResponse["list"][number]): ChatMessage {
  return {
    messageId: message.messageId,
    conversationId: message.conversationId,
    senderUid: message.senderUid,
    receiverUid: message.receiverUid,
    payload: message.payload,
    messageType: message.messageType,
    payloadType: message.payloadType,
    fileId: message.fileId,
    clientMsgTime: message.clientMsgTime,
    serverMsgTime: message.serverMsgTime,
    serverStatus: message.serverStatus
  };
}

function getStoredAuthState(): StoredAuthState | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthState) : null;
  } catch {
    return null;
  }
}

export function getPersistedAuthTokens(): AuthTokens | null {
  const authState = getStoredAuthState();
  if (!authState) {
    return null;
  }
  return {
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    expiresIn: 0
  };
}

function saveStoredAuthState(tokens: AuthTokens): void {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    } satisfies StoredAuthState)
  );
}

export function clearStoredAuthState(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function isUnauthorized(status: number, code?: number): boolean {
  return status === 401 || code === 401001;
}

async function refreshAccessToken(): Promise<AuthTokens> {
  const authState = getStoredAuthState();
  if (!authState?.refreshToken) {
    clearStoredAuthState();
    throw new ApiError("登录状态已失效，请重新登录", { status: 401 });
  }
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const token = await requestJson<AuthTokenResponse>(
          "/auth/refresh-token",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken: authState.refreshToken })
          },
          false,
          false
        );
        const nextTokens = mapTokenResponse(token);
        saveStoredAuthState(nextTokens);
        return nextTokens;
      } catch (error) {
        clearStoredAuthState();
        throw error;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function requestJson<T>(path: string, init?: RequestInit, requiresAuth = false, allowRefresh = true): Promise<T> {
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
      if (requiresAuth && allowRefresh && isUnauthorized(response.status, apiPayload?.code)) {
        await refreshAccessToken();
        return requestJson<T>(path, init, requiresAuth, false);
      }
      throw new ApiError((payload as ApiErrorPayload | null)?.message ?? "请求失败", {
        code: apiPayload?.code,
        status: response.status
      });
    }

    const envelope = payload as ApiEnvelope<T>;
    if (typeof envelope?.code === "number" && envelope.code !== 0) {
      if (requiresAuth && allowRefresh && isUnauthorized(response.status, envelope.code)) {
        await refreshAccessToken();
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

async function requestWithoutEnvelope(input: string, init?: RequestInit): Promise<Response> {
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

async function readJsonWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    return await requestJson<T>(path);
  } catch {
    return fallback;
  }
}

export function fetchTodayFortune(): Promise<FortuneToday> {
  return readJsonWithFallback("/system/fortune/today", {
    title: "今日运势",
    summary: "今天适合整理情绪与节奏。",
    luckyColor: "蓝色",
    luckyDirection: "东南",
    advice: "在重要对话中保持耐心。"
  });
}

export function fetchDisguiseConfig(): Promise<DisguiseConfig> {
  return readJsonWithFallback("/system/disguise-config", {
    siteTitle: "今日运势",
    showFortuneInput: true,
    theme: "default"
  });
}

export async function verifyLuckyNumber(luckyNumber: string): Promise<LuckyNumberVerifyResult> {
  return requestJson<LuckyNumberVerifyResult>("/system/disguise/verify-lucky-number", {
    method: "POST",
    body: JSON.stringify({ luckyNumber })
  });
}

export async function sendEmailCode(email: string, bizType: "register" | "login" | "reset_password"): Promise<void> {
  await requestJson<void>("/auth/email/send-code", {
    method: "POST",
    body: JSON.stringify({ email, bizType })
  });
}

export async function registerByEmail(input: {
  email: string;
  password: string;
  nickname: string;
  emailCode: string;
}): Promise<void> {
  await requestJson<void>("/auth/email/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function loginByPassword(input: {
  email: string;
  password: string;
}): Promise<{ tokens: AuthTokens; user: LocalUser }> {
  const token = await requestJson<AuthTokenResponse>("/auth/email/password-login", {
    method: "POST",
    body: JSON.stringify(input)
  });
  const tokens = mapTokenResponse(token);
  saveStoredAuthState(tokens);
  return {
    tokens,
    user: mapUserInfoToLocalUser(token.userInfo, input.email)
  };
}

export async function loginByEmailCode(input: {
  email: string;
  emailCode: string;
}): Promise<{ tokens: AuthTokens; user: LocalUser }> {
  const token = await requestJson<AuthTokenResponse>("/auth/email/code-login", {
    method: "POST",
    body: JSON.stringify(input)
  });
  const tokens = mapTokenResponse(token);
  saveStoredAuthState(tokens);
  return {
    tokens,
    user: mapUserInfoToLocalUser(token.userInfo, input.email)
  };
}

export async function resetPassword(input: {
  email: string;
  emailCode: string;
  newPassword: string;
}): Promise<void> {
  await requestJson<void>("/auth/email/reset-password", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function logout(refreshToken: string): Promise<void> {
  await requestJson<void>(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    },
    true
  );
  clearStoredAuthState();
}

export async function fetchCurrentUser(email?: string): Promise<LocalUser> {
  const user = await requestJson<UserProfileResponse>("/user/me", { method: "GET" }, true);
  return {
    userUid: user.userUid,
    nickname: user.nickname,
    email,
    avatarUrl: user.avatarUrl
  };
}

export async function listContacts(): Promise<ContactItem[]> {
  return requestJson<ContactItem[]>("/contact/list", { method: "GET" }, true);
}

export async function addContact(peerUid: string, remarkName: string): Promise<void> {
  await requestJson<void>(
    "/contact/add",
    {
      method: "POST",
      body: JSON.stringify({ peerUid, remarkName })
    },
    true
  );
}

export async function listRecentContacts(limit = 4): Promise<RecentContactItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  return requestJson<RecentContactItem[]>(`/contact/recent?${params.toString()}`, { method: "GET" }, true);
}

export async function searchUsers(keyword: string): Promise<UserSearchItem[]> {
  const params = new URLSearchParams({ keyword });
  return requestJson<UserSearchItem[]>(`/user/search?${params.toString()}`, { method: "GET" }, true);
}

export async function listConversations(): Promise<ConversationItem[]> {
  return requestJson<ConversationItem[]>("/conversation/list", { method: "GET" }, true);
}

export async function createSingleConversation(peerUid: string): Promise<ConversationItem> {
  return requestJson<ConversationItem>(
    "/conversation/single",
    {
      method: "POST",
      body: JSON.stringify({ peerUid })
    },
    true
  );
}

export async function clearConversationUnread(conversationId: string): Promise<void> {
  await requestJson<void>(
    "/conversation/clear-unread",
    {
      method: "POST",
      body: JSON.stringify({ conversationId })
    },
    true
  );
}

export async function listMessageHistory(conversationId: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams({
    conversationId,
    pageSize: "50"
  });
  const history = await requestJson<MessageHistoryResponse>(`/message/history?${params.toString()}`, { method: "GET" }, true);
  return history.list.map(mapMessage).sort((left, right) => left.serverMsgTime - right.serverMsgTime);
}

export async function sendMessage(input: {
  messageId?: string;
  conversationId: string;
  receiverUid: string;
  payload: string;
  messageType?: "text" | "image" | "file";
  payloadType?: "text" | "plain" | "ref" | "encrypted";
  fileId?: string;
  clientMsgTime: number;
}): Promise<ChatMessage> {
  const message = await requestJson<MessageHistoryResponse["list"][number]>(
    "/message/send",
    {
      method: "POST",
      body: JSON.stringify({
        messageId: input.messageId,
        conversationId: input.conversationId,
        receiverUid: input.receiverUid,
        messageType: input.messageType ?? "text",
        payloadType: input.payloadType ?? "text",
        payload: input.payload,
        fileId: input.fileId,
        clientMsgTime: input.clientMsgTime
      })
    },
    true
  );
  return mapMessage(message);
}

export async function markMessagesRead(conversationId: string, messageIds: string[]): Promise<void> {
  await requestJson<void>(
    "/message/read",
    {
      method: "POST",
      body: JSON.stringify({ conversationId, messageIds })
    },
    true
  );
}

export async function uploadFile(file: File, encryptFlag = false): Promise<FileInfo> {
  const uploadSign = await requestJson<FileUploadSignResponse>(
    "/file/upload-sign",
    {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        encryptFlag
      })
    },
    true
  );

  const uploadHeaders = new Headers(uploadSign.headers);
  if (!uploadHeaders.has("Content-Type")) {
    uploadHeaders.set("Content-Type", file.type || "application/octet-stream");
  }
  const authState = getStoredAuthState();
  if (authState?.accessToken) {
    uploadHeaders.set("Authorization", `Bearer ${authState.accessToken}`);
  }

  await requestWithoutEnvelope(resolveUrl(uploadSign.uploadUrl), {
    method: "PUT",
    headers: uploadHeaders,
    body: file
  });

  return requestJson<FileInfo>(
    "/file/complete",
    {
      method: "POST",
      body: JSON.stringify({
        fileId: uploadSign.fileId,
        storageKey: uploadSign.storageKey,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        encryptFlag
      })
    },
    true
  );
}

export function createChatWebSocket(accessToken: string): WebSocket {
  const configuredUrl = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  const url = configuredUrl
    ? new URL(configuredUrl, window.location.origin)
    : new URL(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/chat`);
  url.searchParams.set("token", accessToken);
  return new WebSocket(url);
}

// 伪装入口相关 API
export async function getTodayFortune(): Promise<FortuneToday> {
  return requestJson<FortuneToday>("/system/fortune/today", {
    method: "GET"
  });
}

export async function getDisguiseConfig(): Promise<DisguiseConfig> {
  return requestJson<DisguiseConfig>("/system/disguise-config", {
    method: "GET"
  });
}

function resolveUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, window.location.origin).toString();
}
