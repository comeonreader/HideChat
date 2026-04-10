import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { clearCachedConversations, deleteLocalSecret, loadCachedConversation } from "../../src/storage";

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

describe("hidechat app flow", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.stubGlobal("WebSocket", IdleWebSocket as unknown as typeof WebSocket);
    window.localStorage.clear();
    await clearCachedConversations();
    await deleteLocalSecret("pin:u_1001");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        );
        const method = init?.method ?? (input instanceof Request ? input.method : "GET");
        const body = init?.body ?? (input instanceof Request ? input.body : null);
        const jsonBody = typeof body === "string" ? JSON.parse(body) : null;

        if (url.endsWith("/api/system/fortune/today")) {
          return new Response(
            JSON.stringify({
              data: {
                title: "今日运势",
                summary: "今天适合整理情绪与节奏。",
                luckyColor: "蓝色",
                luckyDirection: "东南",
                advice: "在重要对话中保持耐心。"
              }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (url.endsWith("/api/system/disguise-config")) {
          return new Response(
            JSON.stringify({
              data: {
                siteTitle: "今日运势",
                showFortuneInput: true,
                theme: "default"
              }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (url.endsWith("/api/system/disguise/verify-lucky-number") && method === "POST") {
          if (jsonBody?.luckyNumber === "2468") {
            return jsonResponse({
              code: 0,
              data: { matched: true }
            });
          }
          return jsonResponse({
            code: 420201,
            message: "luckyCode 校验失败",
            data: null
          });
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
                createdAt: Date.now()
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

        if (url.endsWith("/api/message/send") && method === "POST") {
          return jsonResponse({
            code: 0,
            data: {
              messageId: jsonBody?.messageId ?? "m_1001",
              conversationId: "c_1001",
              senderUid: "u_1001",
              receiverUid: "u_2001",
              messageType: "text",
              payloadType: "text",
              payload: jsonBody?.payload ?? "",
              serverMsgTime: 1712620800200,
              serverStatus: "delivered"
            }
          });
        }

        return new Response(null, { status: 404 });
      })
    );
  });

  it("covers disguise entry, pin setup, send message, cache encryption, and relock", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });

    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByRole("button", { name: "使用当前信息进入" });
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "设置 PIN 并继续" }));

    await waitFor(() => expect(screen.getAllByText("Anna").length).toBeGreaterThan(0));

    await user.type(screen.getByLabelText("消息输入框"), "你好，隐藏世界");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await screen.findByText("你好，隐藏世界");
    await user.click(screen.getByRole("button", { name: "添加好友" }));
    expect(screen.getByText("最近添加")).toBeInTheDocument();
    expect(screen.getByText(/已添加/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "返回聊天" }));
    await user.click(screen.getByRole("button", { name: "进入聊天" }));

    await waitFor(async () => {
      const cached = await loadCachedConversation("c_1001");
      expect(cached).not.toBeNull();
      expect(cached?.encryptedPayload).not.toContain("你好，隐藏世界");
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden"
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await screen.findByText("聊天已在页面切换后自动锁定。");
    await screen.findByLabelText("请输入今日幸运数字");

    await user.clear(screen.getByLabelText("请输入今日幸运数字"));
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByRole("button", { name: "解锁消息缓存" });
    await user.clear(screen.getByLabelText("PIN 解锁"));
    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "解锁消息缓存" }));

    await screen.findByText("你好，隐藏世界");
    expect(screen.getByText("PIN 校验通过，已恢复隐藏聊天界面。")).toBeInTheDocument();
  });

  it("supports email code registration and then enters chat", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    const originalImplementation = fetchMock.getMockImplementation();
    if (!originalImplementation) {
      throw new Error("missing base fetch mock");
    }
    fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      );
      const method = init?.method ?? (input instanceof Request ? input.method : "GET");
      const body = init?.body ?? (input instanceof Request ? input.body : null);
      const jsonBody = typeof body === "string" ? JSON.parse(body) : null;

      if (url.endsWith("/api/auth/email/send-code") && method === "POST") {
        expect(jsonBody).toEqual({
          email: "alice@example.com",
          bizType: "register"
        });
        return jsonResponse({ code: 0, data: null });
      }

      if (url.endsWith("/api/auth/email/register") && method === "POST") {
        expect(jsonBody).toEqual({
          email: "alice@example.com",
          password: "Abcd1234",
          nickname: "Alice",
          emailCode: "123456"
        });
        return jsonResponse({
          code: 0,
          data: {
            userUid: "u_1001"
          }
        });
      }

      return (await originalImplementation(input, init)) as Response;
    });

    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByRole("button", { name: "使用当前信息进入" });
    await user.click(screen.getByRole("button", { name: "注册" }));
    await user.type(screen.getByPlaceholderText("邮箱"), "alice@example.com");
    await user.type(screen.getByPlaceholderText("昵称"), "Alice");
    await user.type(screen.getByPlaceholderText("密码"), "Abcd1234");
    await user.type(screen.getByPlaceholderText("邮箱验证码"), "123456");

    await user.click(screen.getByRole("button", { name: "发送验证码" }));
    await screen.findByText("验证码已发送，请查收邮箱；如使用本地 MailPit，可在 http://localhost:8025 查看。");

    await user.click(screen.getByRole("button", { name: "注册并进入" }));
    await screen.findByText("已连接后端账号，请继续设置或输入 PIN。");
  });

  it("still enters chat when restoring message history fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    const originalImplementation = fetchMock.getMockImplementation();
    if (!originalImplementation) {
      throw new Error("missing base fetch mock");
    }
    fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      );

      if (url.includes("/api/message/history")) {
        return jsonResponse({
          code: 500001,
          message: "历史消息恢复失败",
          data: null
        });
      }

      return (await originalImplementation(input, init)) as Response;
    });

    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByRole("button", { name: "使用当前信息进入" });
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "设置 PIN 并继续" }));

    await waitFor(() => expect(screen.getAllByText("Anna").length).toBeGreaterThan(0));
    expect(screen.getByText("PIN 已设置，已进入聊天页；部分历史消息恢复失败。")).toBeInTheDocument();
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
