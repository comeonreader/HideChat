import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { loadCachedConversation } from "../../src/storage";

describe("hidechat app flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        );

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

        return new Response(null, { status: 404 });
      })
    );
  });

  it("covers disguise entry, pin setup, send message, cache encryption, and relock", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: "今日运势", level: 1 });

    await user.type(screen.getByLabelText("幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "进入隐藏入口" }));

    await screen.findByRole("button", { name: "使用当前信息进入" });
    await user.click(screen.getByRole("button", { name: "使用当前信息进入" }));

    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "设置 PIN 并继续" }));

    await screen.findByRole("heading", { name: "Anna" });

    await user.type(screen.getByPlaceholderText("输入加密前的原始消息文本"), "你好，隐藏世界");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await screen.findByText("你好，隐藏世界");

    await waitFor(async () => {
      const cached = await loadCachedConversation("c_demo_1");
      expect(cached).not.toBeNull();
      expect(cached?.encryptedPayload).not.toContain("你好，隐藏世界");
    });

    await user.click(screen.getByRole("button", { name: "返回伪装页" }));
    await screen.findByLabelText("幸运数字");

    await user.clear(screen.getByLabelText("幸运数字"));
    await user.type(screen.getByLabelText("幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "进入隐藏入口" }));

    await user.clear(screen.getByLabelText("PIN 解锁"));
    await user.type(screen.getByLabelText("PIN 解锁"), "1357");
    await user.click(screen.getByRole("button", { name: "解锁消息缓存" }));

    await screen.findByText("你好，隐藏世界");
    expect(screen.getByText("PIN 校验通过，已恢复隐藏聊天界面。")).toBeInTheDocument();
  });
});
