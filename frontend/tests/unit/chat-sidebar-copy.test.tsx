import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";

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

describe("chat sidebar copy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    vi.stubGlobal("WebSocket", IdleWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal("fetch", createFetchMock());
  });

  it("uses conversation-list wording and keeps sidebar previews masked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));
    await screen.findByText("隐藏入口验证");
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));
    await user.click(await screen.findByRole("button", { name: "返回列表" }));

    await waitFor(() => expect(screen.getByText("最近会话")).toBeInTheDocument());
    expect(screen.getByRole("list", { name: "会话列表" })).toBeInTheDocument();
    expect(screen.getByText(/会话列表基于当前 filteredConversations 数据渲染，所有预览继续保持脱敏占位。/)).toBeInTheDocument();
    expect(screen.getByText("[文件消息]")).toBeInTheDocument();
    expect(screen.queryByText("项目草稿-v3.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("我晚点把图片发你，记得看一下。")).not.toBeInTheDocument();
    expect(screen.queryByText("最近联系人")).not.toBeInTheDocument();
    expect(screen.queryByText("联系人列表")).not.toBeInTheDocument();
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
