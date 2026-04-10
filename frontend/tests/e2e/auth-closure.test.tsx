import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";

class IdleWebSocket {
  static OPEN = 1;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(_url: string | URL) {}

  send(_message: string) {}

  close() {
    this.onclose?.();
  }
}

interface FetchMockOptions {
  codeLoginSuccess?: boolean;
  resetPasswordSuccess?: boolean;
  trackRequests?: Array<{ url: string; method: string; body: unknown }>;
}

describe("hidechat auth closure", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("WebSocket", IdleWebSocket as unknown as typeof WebSocket);
    window.localStorage.clear();
  });

  it("supports email code login success", async () => {
    vi.stubGlobal("fetch", createFetchMock());
    const user = userEvent.setup();

    render(<App />);
    await enterAuthView(user);

    await user.type(screen.getByPlaceholderText("邮箱"), "reader@example.com");
    await user.click(screen.getByRole("button", { name: "验证码登录" }));
    await user.type(screen.getByPlaceholderText("邮箱验证码"), "123456");
    await user.click(screen.getByRole("button", { name: "发送验证码" }));
    await screen.findByText("验证码已发送，请查收邮箱；如使用本地 MailPit，可在 http://localhost:8025 查看。");

    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));
    await screen.findByText("已连接后端账号，请继续设置或输入 PIN。");
    expect(screen.getByRole("button", { name: "设置 PIN 并继续" })).toBeEnabled();
  });

  it("shows backend error when email code login fails", async () => {
    vi.stubGlobal("fetch", createFetchMock({ codeLoginSuccess: false }));
    const user = userEvent.setup();

    render(<App />);
    await enterAuthView(user);

    await user.type(screen.getByPlaceholderText("邮箱"), "reader@example.com");
    await user.click(screen.getByRole("button", { name: "验证码登录" }));
    await user.type(screen.getByPlaceholderText("邮箱验证码"), "000000");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await screen.findByText("验证码错误");
  });

  it("supports requesting reset password code and submitting reset successfully", async () => {
    vi.stubGlobal("fetch", createFetchMock());
    const user = userEvent.setup();

    render(<App />);
    await enterAuthView(user);

    await user.click(screen.getByRole("button", { name: "找回密码" }));
    await user.type(screen.getByPlaceholderText("邮箱"), "reader@example.com");
    await user.type(screen.getByPlaceholderText("新密码"), "NewPass123");
    await user.type(screen.getByPlaceholderText("邮箱验证码"), "654321");

    await user.click(screen.getByRole("button", { name: "发送验证码" }));
    await screen.findByText("验证码已发送，请查收邮箱；如使用本地 MailPit，可在 http://localhost:8025 查看。");

    await user.click(screen.getByRole("button", { name: "重置密码" }));
    await screen.findByText("密码已重置，请使用新密码重新登录。");
    expect(screen.getByRole("button", { name: "使用当前信息进入" })).toBeInTheDocument();
  });

  it("shows backend error when reset password submission fails", async () => {
    vi.stubGlobal("fetch", createFetchMock({ resetPasswordSuccess: false }));
    const user = userEvent.setup();

    render(<App />);
    await enterAuthView(user);

    await user.click(screen.getByRole("button", { name: "找回密码" }));
    await user.type(screen.getByPlaceholderText("邮箱"), "reader@example.com");
    await user.type(screen.getByPlaceholderText("新密码"), "NewPass123");
    await user.type(screen.getByPlaceholderText("邮箱验证码"), "111111");
    await user.click(screen.getByRole("button", { name: "重置密码" }));

    await screen.findByText("验证码已失效");
  });

  it("calls backend logout and returns to disguise entry", async () => {
    const requestLog: Array<{ url: string; method: string; body: unknown }> = [];
    vi.stubGlobal("fetch", createFetchMock({ trackRequests: requestLog }));
    const user = userEvent.setup();

    render(<App />);
    await enterAuthView(user);

    await user.type(screen.getByPlaceholderText("邮箱"), "reader@example.com");
    await user.type(screen.getByPlaceholderText("密码"), "Pass1234");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "设置 PIN 并继续" }));
    await waitFor(() => expect(screen.getAllByText("Anna").length).toBeGreaterThan(0));

    await user.click(screen.getByRole("button", { name: "退出账号" }));

    await screen.findByLabelText("请输入今日幸运数字");
    expect(window.localStorage.getItem("hidechat-auth")).toBeNull();
    expect(
      requestLog.find((entry) => entry.url.endsWith("/api/auth/logout") && entry.method === "POST")
    ).toMatchObject({
      body: { refreshToken: "refresh-token" }
    });
  });
});

function createFetchMock(options: FetchMockOptions = {}) {
  const {
    codeLoginSuccess = true,
    resetPasswordSuccess = true,
    trackRequests
  } = options;

  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : null;
    const url = String(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = init?.method ?? request?.method ?? "GET";
    const body = init?.body ?? request?.body ?? null;
    const jsonBody = typeof body === "string" ? JSON.parse(body) : null;

    trackRequests?.push({ url, method, body: jsonBody });

    if (url.endsWith("/api/system/fortune/today")) {
      return jsonResponse({
        data: {
          title: "今日运势",
          summary: "今天适合整理情绪与节奏。",
          luckyColor: "蓝色",
          luckyDirection: "东南",
          advice: "在重要对话中保持耐心。"
        }
      });
    }

    if (url.endsWith("/api/system/disguise-config")) {
      return jsonResponse({
        data: {
          siteTitle: "今日运势",
          showFortuneInput: true,
          theme: "default"
        }
      });
    }

    if (url.endsWith("/api/system/disguise/verify-lucky-number") && method === "POST") {
      return jsonResponse({
        code: 0,
        data: { matched: true }
      });
    }

    if (url.endsWith("/api/auth/email/send-code") && method === "POST") {
      return jsonResponse({ code: 0, data: null });
    }

    if (url.endsWith("/api/auth/email/password-login") && method === "POST") {
      return jsonResponse({
        code: 0,
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 7200,
          userInfo: {
            userUid: "u_1001",
            nickname: "Reader"
          }
        }
      });
    }

    if (url.endsWith("/api/auth/email/code-login") && method === "POST") {
      if (!codeLoginSuccess) {
        return jsonResponse({
          code: 410103,
          message: "验证码错误",
          data: null
        });
      }
      return jsonResponse({
        code: 0,
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 7200,
          userInfo: {
            userUid: "u_1001",
            nickname: "Reader"
          }
        }
      });
    }

    if (url.endsWith("/api/auth/email/reset-password") && method === "POST") {
      if (!resetPasswordSuccess) {
        return jsonResponse({
          code: 410104,
          message: "验证码已失效",
          data: null
        });
      }
      return jsonResponse({ code: 0, data: null });
    }

    if (url.endsWith("/api/auth/logout") && method === "POST") {
      return jsonResponse({ code: 0, data: null });
    }

    if (url.endsWith("/api/user/me")) {
      return jsonResponse({
        code: 0,
        data: {
          userUid: "u_1001",
          displayUserId: "hide_u1001",
          nickname: "Reader"
        }
      });
    }

    if (url.endsWith("/api/contact/list")) {
      return jsonResponse({
        code: 0,
        data: [
          {
            peerUid: "u_2001",
            peerNickname: "Anna",
            remarkName: "Anna",
            lastMessageAt: 1712620800000
          }
        ]
      });
    }

    if (url.includes("/api/contact/recent")) {
      return jsonResponse({
        code: 0,
        data: [
          {
            peerUid: "u_2001",
            displayUserId: "hide_2001",
            peerNickname: "Anna",
            createdAt: 1712620800000
          }
        ]
      });
    }

    if (url.endsWith("/api/conversation/list")) {
      return jsonResponse({
        code: 0,
        data: [
          {
            conversationId: "c_1001",
            peerUid: "u_2001",
            peerNickname: "Anna",
            remarkName: "Anna",
            lastMessagePreview: "",
            lastMessageAt: 1712620800000,
            unreadCount: 0
          }
        ]
      });
    }

    if (url.includes("/api/message/history")) {
      return jsonResponse({
        code: 0,
        data: {
          list: [],
          hasMore: false
        }
      });
    }

    if (url.endsWith("/api/conversation/clear-unread")) {
      return jsonResponse({ code: 0, data: null });
    }

    return new Response(JSON.stringify({ code: 404, message: `Unhandled request: ${method} ${url}` }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  });
}

async function enterAuthView(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("button", { name: "查看彩蛋" });
  await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
  await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
  await screen.findByRole("button", { name: "使用当前信息进入" });
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
