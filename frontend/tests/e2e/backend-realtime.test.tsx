import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;

  readyState = MockWebSocket.OPEN;
  sentMessages: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public readonly url: string | URL) {
    MockWebSocket.instances.push(this);
  }

  send(message: string) {
    this.sentMessages.push(message);
  }

  close() {
    this.onclose?.();
  }

  emitOpen() {
    this.onopen?.();
  }

  emitMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
  }
}

describe("hidechat backend realtime flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    MockWebSocket.instances = [];
    window.localStorage.clear();
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal("fetch", createFetchMock());
  });

  it("connects backend api, enters chat directly, sends websocket message, receives realtime push, and uploads image and file messages", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await waitFor(() => expect(screen.getAllByText("Anna").length).toBeGreaterThan(0));
    expect(MockWebSocket.instances).toHaveLength(1);
    const socket = MockWebSocket.instances[0];
    socket.emitOpen();

    await user.type(screen.getByLabelText("消息输入框"), "后端实时文本");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(socket.sentMessages).toHaveLength(1));
    const sentMessage = JSON.parse(socket.sentMessages[0]) as { data: { messageId: string } };

    socket.emitMessage({
      type: "CHAT_ACK",
      data: {
        messageId: sentMessage.data.messageId,
        message: {
          messageId: sentMessage.data.messageId,
          conversationId: "c_1001",
          senderUid: "u_1001",
          receiverUid: "u_2001",
          messageType: "text",
          payloadType: "plain",
          payload: "后端实时文本",
          serverMsgTime: 1712620800100,
          serverStatus: "delivered"
        }
      }
    });

    socket.emitMessage({
      type: "CHAT_RECEIVE",
      data: {
        messageId: "m_2002",
        conversationId: "c_1001",
        senderUid: "u_2001",
        receiverUid: "u_1001",
        messageType: "text",
        payloadType: "plain",
        payload: "已收到",
        serverMsgTime: 1712620800200,
        serverStatus: "delivered"
      }
    });

    await screen.findByText("已收到");

    await user.upload(screen.getByLabelText("发送图片"), new File(["img"], "photo.png", { type: "image/png" }));
    await screen.findByText("photo.png");

    await user.upload(screen.getByLabelText("发送文件"), new File(["doc"], "notes.txt", { type: "text/plain" }));
    await screen.findByText("notes.txt");
  });

  it("refreshes conversation list before showing a realtime message from an unknown conversation", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        conversations: [[], [{ conversationId: "c_2002", peerUid: "u_2002", peerNickname: "Ben", remarkName: "Ben", lastMessagePreview: "", lastMessageAt: 1712620800300, unreadCount: 1 }]]
      })
    );

    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    expect(MockWebSocket.instances).toHaveLength(1);
    const socket = MockWebSocket.instances[0];
    socket.emitOpen();

    socket.emitMessage({
      type: "CHAT_RECEIVE",
      data: {
        messageId: "m_3001",
        conversationId: "c_2002",
        senderUid: "u_2002",
        receiverUid: "u_1001",
        messageType: "text",
        payloadType: "plain",
        payload: "陌生会话的第一条消息",
        serverMsgTime: 1712620800300,
        serverStatus: "delivered"
      }
    });

    const conversationButton = await screen.findByRole("button", { name: /Ben/ });
    await user.click(conversationButton);
    await screen.findByText("陌生会话的第一条消息");
  });
});

function createFetchMock(options?: {
  conversations?: Array<
    Array<{
      conversationId: string;
      peerUid: string;
      peerNickname: string;
      remarkName: string;
      lastMessagePreview: string;
      lastMessageAt: number;
      unreadCount: number;
    }>
  >;
}) {
  let conversationCallCount = 0;

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
      const configuredConversations = options?.conversations;
      const conversationData =
        configuredConversations?.[Math.min(conversationCallCount++, configuredConversations.length - 1)] ?? [
          {
            conversationId: "c_1001",
            peerUid: "u_2001",
            peerNickname: "Anna",
            remarkName: "Anna",
            lastMessagePreview: "",
            lastMessageAt: 1712620800000,
            unreadCount: 0
          }
        ];
      return jsonResponse({
        code: 0,
        data: conversationData
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

    if (url.endsWith("/api/conversation/clear-unread") || url.endsWith("/api/message/read")) {
      return jsonResponse({ code: 0, data: null });
    }

    if (url.endsWith("/api/file/upload-sign") && method === "POST") {
      const fileName = jsonBody?.fileName ?? "photo.png";
      const mimeType = jsonBody?.mimeType ?? "image/png";
      const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : ".bin";
      return jsonResponse({
        code: 0,
        data: {
          fileId: "f_1001",
          storageKey: `chat/2026/04/09/f_1001${extension}`,
          uploadUrl: "/api/file/upload/f_1001",
          headers: {
            "Content-Type": mimeType
          }
        }
      });
    }

    if (url.endsWith("/api/file/upload/f_1001") && method === "PUT") {
      return new Response(null, { status: 200 });
    }

    if (url.endsWith("/api/file/complete") && method === "POST") {
      const mimeType = jsonBody?.mimeType ?? "image/png";
      const fileName = mimeType === "text/plain" ? "notes.txt" : "photo.png";
      return jsonResponse({
        code: 0,
        data: {
          fileId: "f_1001",
          fileName,
          mimeType,
          fileSize: 2048,
          accessUrl: "/api/file/content/f_1001?expires=999&signature=sig",
          downloadUrl: "/api/file/content/f_1001?expires=999&signature=sig&download=true",
          encryptFlag: false
        }
      });
    }

    return new Response(JSON.stringify({ code: 404, message: `Unhandled request: ${method} ${url}` }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  });
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
