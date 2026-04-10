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
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const request = input instanceof Request ? input : null;
        const url = String(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        );
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
          const fileName = mimeType === "application/pdf" ? "project-draft-v3.pdf" : "photo.png";
          return jsonResponse({
            code: 0,
            data: {
              fileId: "f_1001",
              fileName,
              mimeType,
              fileSize: mimeType === "application/pdf" ? 2048 : 4,
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
      })
    );
  });

  it("connects backend api, sends websocket message, receives realtime push, and uploads image and file messages", async () => {
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
          payloadType: "text",
          payload: "后端实时文本",
          serverMsgTime: 1712620800100,
          serverStatus: "delivered"
        }
      }
    });

    socket.emitMessage({
      type: "CHAT_RECEIVE",
      data: {
        messageId: "m_peer_1",
        conversationId: "c_1001",
        senderUid: "u_2001",
        receiverUid: "u_1001",
        messageType: "text",
        payloadType: "text",
        payload: "收到你的消息",
        serverMsgTime: 1712620800200,
        serverStatus: "delivered"
      }
    });

    await screen.findByText("收到你的消息");

    const fileInput = screen.getByLabelText("发送图片");
    await user.upload(fileInput, new File(["img!"], "photo.png", { type: "image/png" }));

    await waitFor(() => expect(socket.sentMessages).toHaveLength(3));
    expect(screen.getByRole("img", { name: "photo.png" })).toBeInTheDocument();

    const genericFileInput = screen.getByLabelText("发送文件");
    await user.upload(genericFileInput, new File(["pdf"], "project-draft-v3.pdf", { type: "application/pdf" }));

    await waitFor(() => expect(socket.sentMessages).toHaveLength(4));
    expect(screen.getByText("project-draft-v3.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB · 点击可下载")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载文件" })).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("搜索聊天记录"));
    await user.type(screen.getByPlaceholderText("搜索聊天记录"), "project-draft");
    expect(screen.getByText("project-draft-v3.pdf")).toBeInTheDocument();
    expect(screen.queryByText("后端实时文本")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("搜索聊天记录"));
    await user.type(screen.getByPlaceholderText("搜索聊天记录"), "not-found");
    expect(screen.getByText("没有匹配的聊天记录")).toBeInTheDocument();
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
