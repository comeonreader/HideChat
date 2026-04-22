import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { clearCachedConversations } from "../../src/storage";

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

describe("app shell integration", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.stubGlobal("WebSocket", IdleWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal("fetch", createFetchMock());
    window.localStorage.clear();
    await clearCachedConversations();
    installMatchMediaMock(false);
  });

  it("renders desktop auth and chat shell without changing the main flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await screen.findByText("认证成功，已进入聊天。");
    await waitFor(() => expect(screen.getAllByText("Anna").length).toBeGreaterThan(0));
    expect(screen.getByText("历史你好")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "退出账号" })).toBeInTheDocument();
  });

  it("keeps the mobile shell on conversation list after auth", async () => {
    installMatchMediaMock(true);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await screen.findByText("最近会话");
    expect(screen.queryByLabelText("消息输入框")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "手机端底部导航" })).toBeInTheDocument();
  });
});

function createFetchMock() {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");

    if (url.endsWith("/api/system/fortune/today")) {
      return jsonResponse({
        code: 0,
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
        code: 0,
        data: {
          siteTitle: "今日运势",
          showFortuneInput: true,
          theme: "default"
        }
      });
    }

    if (url.endsWith("/api/system/disguise/verify-lucky-number") && method === "POST") {
      return jsonResponse({ code: 0, data: { matched: true } });
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
      return jsonResponse({ code: 0, data: [] });
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
            previewStrategy: "masked",
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

    if (url.endsWith("/api/conversation/clear-unread") || url.endsWith("/api/message/read")) {
      return jsonResponse({ code: 0, data: null });
    }

    if (url.endsWith("/api/auth/logout")) {
      return jsonResponse({ code: 0, data: null });
    }

    return new Response(null, { status: 404 });
  });
}

function installMatchMediaMock(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let currentMatches = matches;
  const mediaQueryList = {
    get matches() {
      return currentMatches;
    },
    media: "(max-width: 900px)",
    onchange: null,
    addEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === "function") {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    },
    removeEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === "function") {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      }
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: (event: Event) => {
      listeners.forEach((listener) => listener(event as MediaQueryListEvent));
      return true;
    }
  } satisfies MediaQueryList;

  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    ...mediaQueryList,
    media: query
  })));

  return {
    setMatches(nextMatches: boolean) {
      currentMatches = nextMatches;
      mediaQueryList.dispatchEvent({ matches: nextMatches } as MediaQueryListEvent);
    }
  };
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
