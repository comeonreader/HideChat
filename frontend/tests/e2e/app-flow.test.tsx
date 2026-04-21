import { render, screen, waitFor, within } from "@testing-library/react";
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
    installMatchMediaMock(false);
  });

  it("keeps desktop default behavior and enters conversation directly after auth", async () => {
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
    expect(screen.queryByRole("button", { name: "进入聊天" })).not.toBeInTheDocument();
  });

  it("shows recent conversations first on mobile after auth", async () => {
    installMatchMediaMock(true);

    const user = userEvent.setup();
    render(<App />);

    await loginToMobileChatList(user);

    await screen.findByText("认证成功，已进入聊天。");
    await screen.findByText("最近会话");
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Anna/ }).length).toBeGreaterThan(0));
    expect(screen.queryByLabelText("消息输入框")).not.toBeInTheDocument();
    expect(screen.queryByText("历史你好")).not.toBeInTheDocument();
  });

  it("shows recent conversations first on mobile after lucky number verification", async () => {
    installMatchMediaMock(true);
    window.localStorage.setItem(
      "hidechat-auth",
      JSON.stringify({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 7200
      })
    );

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("检测到本地登录态，输入幸运数字后可直接进入聊天。");
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByText("最近会话");
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Anna/ }).length).toBeGreaterThan(0));
    expect(screen.queryByLabelText("消息输入框")).not.toBeInTheDocument();
    expect(screen.queryByText("历史你好")).not.toBeInTheDocument();
  });

  it("opens conversation details on mobile when a conversation is clicked", async () => {
    installMatchMediaMock(true);

    const user = userEvent.setup();
    render(<App />);

    await loginToMobileChatList(user);

    await user.click((await screen.findAllByRole("button", { name: /Anna/ }))[0]);
    await screen.findByRole("button", { name: "返回列表" });
    await screen.findByLabelText("消息输入框");
    await screen.findByText("历史你好");
  });

  it("does not auto-open mobile detail when activeConversationId already exists", async () => {
    const matchMedia = installMatchMediaMock(false);
    const user = userEvent.setup();
    window.localStorage.setItem(
      "hidechat-auth",
      JSON.stringify({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 7200
      })
    );

    render(<App />);

    await screen.findByText("检测到本地登录态，输入幸运数字后可直接进入聊天。");
    await screen.findByText("查看彩蛋");
    matchMedia.setMatches(true);

    await waitFor(() => expect(screen.getByText("查看彩蛋")).toBeInTheDocument());
    await screen.findByLabelText("请输入今日幸运数字");
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByText("最近会话");
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Anna/ }).length).toBeGreaterThan(0));
    expect(screen.queryByLabelText("消息输入框")).not.toBeInTheDocument();
    expect(screen.queryByText("历史你好")).not.toBeInTheDocument();
  });

  it("returns to recent conversations on mobile after clicking back", async () => {
    installMatchMediaMock(true);

    const user = userEvent.setup();
    render(<App />);

    await loginToMobileChatList(user);

    await user.click((await screen.findAllByRole("button", { name: /Anna/ }))[0]);
    await screen.findByLabelText("消息输入框");
    await user.click(screen.getByRole("button", { name: "返回列表" }));

    await screen.findByText("最近会话");
    expect(screen.queryByLabelText("消息输入框")).not.toBeInTheDocument();
    expect(screen.queryByText("历史你好")).not.toBeInTheDocument();
  });

  it("enters chat detail from the mobile friends page after adding a contact", async () => {
    installMatchMediaMock(true);

    const user = userEvent.setup();
    render(<App />);

    await loginToMobileChatList(user);

    await user.click(within(screen.getByRole("navigation", { name: "手机端底部导航" })).getByRole("button", { name: /好友/ }));
    await screen.findByText(/创建会话后直接进入详情页/);

    await user.type(screen.getByPlaceholderText("输入昵称或用户 ID"), "Bob");
    await user.click(screen.getByRole("button", { name: "搜索" }));
    await screen.findByText("ID: hide_3001");

    await user.click(screen.getByRole("button", { name: "添加" }));

    await screen.findByLabelText("消息输入框");
    await screen.findByText("Bob");
    await screen.findByText("暂无消息");
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

  it("opens mobile detail only after user clicks a conversation", async () => {
    installMatchMediaMock(true);

    const user = userEvent.setup();
    render(<App />);

    await loginToMobileChatList(user);

    await user.click(within(screen.getByRole("navigation", { name: "手机端底部导航" })).getByRole("button", { name: /运势/ }));
    await user.click(screen.getByRole("button", { name: "返回幸运数字" }));
    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await screen.findByText("最近会话");
    expect(screen.queryByLabelText("消息输入框")).not.toBeInTheDocument();

    await user.click((await screen.findAllByRole("button", { name: /Anna/ }))[0]);
    await screen.findByLabelText("消息输入框");
    await screen.findByText("历史你好");
  });
});

function createFetchMock() {
  let conversations = [
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
  ];
  let contacts = [
    {
      peerUid: "u_2001",
      peerNickname: "Anna",
      remarkName: "Anna",
      lastMessageAt: 1712620800000
    }
  ];
  let recentContacts = [
    {
      peerUid: "u_2001",
      displayUserId: "hide_2001",
      peerNickname: "Anna",
      createdAt: Date.now()
    }
  ];

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
        data: contacts
      });
    }

    if (url.includes("/api/contact/recent")) {
      return jsonResponse({
        code: 0,
        data: recentContacts
      });
    }

    if (url.endsWith("/api/conversation/list")) {
      return jsonResponse({
        code: 0,
        data: conversations
      });
    }

    if (url.includes("/api/message/history")) {
      const conversationId = new URL(url, "http://localhost").searchParams.get("conversationId");
      if (conversationId === "c_3001") {
        return jsonResponse({
          code: 0,
          data: {
            list: [],
            hasMore: false
          }
        });
      }
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

    if (url.includes("/api/user/search")) {
      return jsonResponse({
        code: 0,
        data: [
          {
            userUid: "u_3001",
            displayUserId: "hide_3001",
            nickname: "Bob",
            matchType: "nickname",
            alreadyAdded: false
          }
        ]
      });
    }

    if (url.endsWith("/api/contact/add") && method === "POST") {
      contacts = [
        {
          peerUid: "u_3001",
          peerNickname: "Bob",
          remarkName: "",
          lastMessageAt: 1712620800300
        },
        ...contacts
      ];
      recentContacts = [
        {
          peerUid: "u_3001",
          displayUserId: "hide_3001",
          peerNickname: "Bob",
          createdAt: 1712620800300
        },
        ...recentContacts
      ];
      return jsonResponse({ code: 0, data: null });
    }

    if (url.endsWith("/api/conversation/single") && method === "POST") {
      conversations = [
        {
          conversationId: "c_3001",
          peerUid: "u_3001",
          peerNickname: "Bob",
          remarkName: "",
          previewStrategy: "masked",
          lastMessagePreview: "",
          lastMessageAt: 1712620800300,
          unreadCount: 0
        },
        ...conversations
      ];
      return jsonResponse({
        code: 0,
        data: conversations[0]
      });
    }

    return new Response(null, { status: 404 });
  });
}

async function loginToMobileChatList(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("button", { name: "查看彩蛋" });
  await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
  await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
  await screen.findByText("隐藏入口验证");
  await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));
  await screen.findByText("认证成功，已进入聊天。");
  await screen.findByText("最近会话");
}

function installMatchMediaMock(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const listenerMap = new Map<EventListenerOrEventListenerObject, (event: MediaQueryListEvent) => void>();
  let currentMatches = matches;
  const normalizeListener = (listener: EventListenerOrEventListenerObject) => {
    const existing = listenerMap.get(listener);
    if (existing) {
      return existing;
    }
    if (typeof listener === "function") {
      const normalized = (event: MediaQueryListEvent) => listener.call(window, event);
      listenerMap.set(listener, normalized);
      return normalized;
    }
    const normalized = (event: MediaQueryListEvent) => listener.handleEvent(event);
    listenerMap.set(listener, normalized);
    return normalized;
  };
  const mediaQueryList = {
    get matches() {
      return currentMatches;
    },
    media: "(max-width: 900px)",
    onchange: null,
    addEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(normalizeListener(listener));
    },
    removeEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(normalizeListener(listener));
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
