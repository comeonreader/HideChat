import type { AuthTokens, LocalUser, UserSearchItem } from "../types";
import { clearStoredAuthState, getStoredAuthState, saveStoredAuthState } from "./auth-storage";
import { requestJson, setAuthTokenRefresher } from "./http";

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

let refreshPromise: Promise<AuthTokens> | null = null;

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

async function refreshAccessToken(): Promise<AuthTokens> {
  const authState = getStoredAuthState();
  if (!authState?.refreshToken) {
    clearStoredAuthState();
    throw new Error("登录状态已失效，请重新登录");
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

setAuthTokenRefresher(refreshAccessToken);

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

export async function searchUsers(keyword: string): Promise<UserSearchItem[]> {
  const params = new URLSearchParams({ keyword });
  return requestJson<UserSearchItem[]>(`/user/search?${params.toString()}`, { method: "GET" }, true);
}
