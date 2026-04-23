import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { MobileConversationDetailPage } from "../../src/pages/mobile/MobileConversationDetailPage";
import type { ChatMessage, ConversationItem } from "../../src/types";

class IdleWebSocket {
  static OPEN = 1;
  readyState = IdleWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(_url: string | URL) {}

  send(_message: string) {}

  close() {
    this.onclose?.();
  }
}

describe("mobile layout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    installMatchMediaMock(true);
    vi.stubGlobal("WebSocket", IdleWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal("fetch", createFetchMock());
  });

  it("does not render a persistent status strip on first mobile paint and keeps the bottom nav accessible after login", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.click(screen.getByRole("button", { name: "看看今日建议" }));
    await user.click(screen.getByRole("button", { name: "返回幸运数字" }));
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await waitFor(() => expect(screen.getByRole("navigation", { name: "手机端底部导航" })).toBeInTheDocument());
    const nav = screen.getByRole("navigation", { name: "手机端底部导航" });
    expect(within(nav).getByRole("button", { name: /聊天/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /好友/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /运势/i })).toBeInTheDocument();
  });

  it("renders mobile conversation detail with separated header, message list, and composer regions", () => {
    const conversation: ConversationItem = {
      conversationId: "c_1001",
      peerUid: "u_2001",
      peerNickname: "Anna",
      remarkName: "Anna",
      previewStrategy: "masked",
      lastMessagePreview: "hello",
      lastMessageType: "text",
      lastMessageAt: 1712620800000,
      unreadCount: 0
    };
    const messages: ChatMessage[] = [
      {
        messageId: "m_1001",
        conversationId: "c_1001",
        senderUid: "u_2001",
        receiverUid: "u_1001",
        payload: "hello",
        messageType: "text",
        payloadType: "plain",
        clientMsgTime: 1712620800000,
        serverMsgTime: 1712620800000,
        serverStatus: "sent"
      }
    ];

    const { container } = render(
      <MobileConversationDetailPage
        conversation={conversation}
        messages={messages}
        sessionUserUid="u_1001"
        composer="test"
        uploadingFile={false}
        onComposerChange={() => undefined}
        onSendMessage={() => undefined}
        onFileSelected={() => undefined}
        onBack={() => undefined}
        onLogout={() => undefined}
        renderMessageBody={(message) => <div className="bubble">{message.payload}</div>}
        getAvatarLabel={(value) => value.slice(0, 1)}
        getConversationTitle={(item) => item.remarkName ?? item.peerNickname ?? item.peerUid}
        formatConversationDivider={() => "今天"}
      />
    );

    expect(container.querySelector(".mobile-conversation-layout")).toBeInTheDocument();
    expect(container.querySelector(".panel-header--mobile-detail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回列表" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "退出账号" })).toBeInTheDocument();
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.queryByText("本地缓存已启用")).not.toBeInTheDocument();
    const messageRegion = screen.getByLabelText("消息列表");
    expect(within(messageRegion).getByText("hello")).toBeInTheDocument();
    expect(container.querySelector(".input-bar--mobile")).toBeInTheDocument();
    expect(screen.getByLabelText("消息输入框")).toHaveValue("test");
  });

  it("keeps the mobile composer as the bottom section of the conversation layout", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));
    await waitFor(() => expect(screen.getByRole("navigation", { name: "手机端底部导航" })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Anna/ }));

    const composerBar = await screen.findByText("发送");
    const composerContainer = composerBar.closest(".input-bar--mobile");
    expect(composerContainer).toBeInTheDocument();
    const conversationLayout = composerContainer?.closest(".mobile-conversation-layout");
    expect(conversationLayout?.lastElementChild).toBe(composerContainer);
    expect(conversationLayout?.querySelector(".messages--mobile")?.nextElementSibling).toBe(composerContainer);
  });

  it("adds bottom offset to the mobile message list based on the composer height", async () => {
    const conversation: ConversationItem = {
      conversationId: "c_1001",
      peerUid: "u_2001",
      peerNickname: "Anna",
      remarkName: "Anna",
      previewStrategy: "masked",
      lastMessagePreview: "hello",
      lastMessageType: "text",
      lastMessageAt: 1712620800000,
      unreadCount: 0
    };
    const messages: ChatMessage[] = [
      {
        messageId: "m_1001",
        conversationId: "c_1001",
        senderUid: "u_2001",
        receiverUid: "u_1001",
        payload: "hello",
        messageType: "text",
        payloadType: "plain",
        clientMsgTime: 1712620800000,
        serverMsgTime: 1712620800000,
        serverStatus: "sent"
      }
    ];

    const { container } = render(
      <MobileConversationDetailPage
        conversation={conversation}
        messages={messages}
        sessionUserUid="u_1001"
        composer="test"
        uploadingFile={false}
        onComposerChange={() => undefined}
        onSendMessage={() => undefined}
        onFileSelected={() => undefined}
        onBack={() => undefined}
        onLogout={() => undefined}
        renderMessageBody={(message) => <div className="bubble">{message.payload}</div>}
        getAvatarLabel={(value) => value.slice(0, 1)}
        getConversationTitle={(item) => item.remarkName ?? item.peerNickname ?? item.peerUid}
        formatConversationDivider={() => "今天"}
      />
    );

    const composerContainer = container.querySelector(".input-bar--mobile");
    expect(composerContainer).toBeInTheDocument();
    vi.spyOn(composerContainer!, "getBoundingClientRect").mockReturnValue({
      width: 0,
      height: 116,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      expect(screen.getByLabelText("消息列表")).toHaveStyle({ paddingBottom: "calc(20px + 116px)" });
    });
  });

  it("hides the mobile bottom nav after entering a conversation detail page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await waitFor(() => expect(screen.getByRole("navigation", { name: "手机端底部导航" })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Anna/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "返回列表" })).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "手机端底部导航" })).not.toBeInTheDocument();
    });
  });
});

function createFetchMock() {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : null;
    const url = String(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = init?.method ?? request?.method ?? "GET";
    const body = init?.body ?? request?.body ?? null;
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
      return jsonResponse({ data: { matched: jsonBody?.luckyNumber === "2468" } });
    }

    if (url.endsWith("/api/auth/email/password-login") && method === "POST") {
      return jsonResponse({
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
        data: {
          userUid: "u_1001",
          displayUserId: "hide_u1001",
          nickname: "Reader"
        }
      });
    }

    if (url.endsWith("/api/contact/list")) {
      return jsonResponse({
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
        data: [
          {
            conversationId: "c_1001",
            peerUid: "u_2001",
            peerNickname: "Anna",
            remarkName: "Anna",
            previewStrategy: "masked",
            lastMessagePreview: "[文件消息]",
            lastMessageType: "file",
            lastMessageAt: 1712620800000,
            unreadCount: 2
          }
        ]
      });
    }

    if (url.includes("/api/message/history")) {
      return jsonResponse({
        data: {
          list: [],
          hasMore: false,
          nextCursor: null
        }
      });
    }

    throw new Error(`Unhandled request: ${method} ${url}`);
  });
}

function jsonResponse(payload: Record<string, unknown>) {
  return Promise.resolve(
    new Response(JSON.stringify({ code: 0, message: "ok", ...payload }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  );
}

function installMatchMediaMock(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}
