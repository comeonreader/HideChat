import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { clearCachedConversations, loadCachedConversation, saveCachedConversation } from "../../src/storage";

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
    vi.stubGlobal("fetch", createFetchMock());
  });

  it("covers lucky number -> auth -> direct chat and direct conversation open", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await screen.findByText("认证成功，已进入聊天。");
    await waitFor(() => expect(screen.getAllByText("Anna").length).toBeGreaterThan(0));
    await screen.findByText("历史你好");
    expect(screen.queryByText("PIN 解锁")).not.toBeInTheDocument();
  });

  it("restores local message cache after refresh without PIN", async () => {
    window.localStorage.setItem(
      "hidechat-auth",
      JSON.stringify({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 7200
      })
    );
    await saveCachedConversation({
      conversationId: "c_1001",
      messages: [
        {
          messageId: "m_local",
          conversationId: "c_1001",
          senderUid: "u_2001",
          receiverUid: "u_1001",
          payload: "来自本地缓存",
          messageType: "text",
          serverMsgTime: 1712620800500,
          serverStatus: "delivered"
        }
      ],
      updatedAt: 1712620800500
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("检测到本地登录态，输入幸运数字后可直接进入聊天。");
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByText("来自本地缓存");
    expect(screen.queryByText("PIN 解锁")).not.toBeInTheDocument();
  });

  it("persists sent messages in local cache without encryption dependency", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await waitFor(() => expect(screen.getAllByText("Anna").length).toBeGreaterThan(0));
    await user.type(screen.getByLabelText("消息输入框"), "你好，直接进入聊天");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await screen.findByText("你好，直接进入聊天");
    await waitFor(async () => {
      const cached = await loadCachedConversation("c_1001");
      expect(cached?.messages.some((item) => item.payload === "你好，直接进入聊天")).toBe(true);
    });
  });
});

function createFetchMock() {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const body = init?.body ?? (input instanceof Request ? input.body : null);
    const jsonBody = typeof body === "string" ? JSON.parse(body) : null;

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
      if (jsonBody?.luckyNumber === "2468") {
        return jsonResponse({ code: 0, data: { matched: true } });
      }
      return jsonResponse({ code: 420201, message: "luckyCode 校验失败", data: null });
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
          list: [
            {
              messageId: "m_history",
              conversationId: "c_1001",
              senderUid: "u_2001",
              receiverUid: "u_1001",
              payload: "历史你好",
              messageType: "text",
              payloadType: "plain",
              serverMsgTime: 1712620800100,
              serverStatus: "delivered"
            }
          ],
          hasMore: false
        }
      });
    }

    if (url.endsWith("/api/conversation/clear-unread")) {
      return jsonResponse({ code: 0, data: null });
    }

    if (url.endsWith("/api/message/read")) {
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
          payloadType: "plain",
          payload: jsonBody?.payload ?? "",
          serverMsgTime: 1712620800200,
          serverStatus: "delivered"
        }
      });
    }

    return new Response(null, { status: 404 });
  });
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
