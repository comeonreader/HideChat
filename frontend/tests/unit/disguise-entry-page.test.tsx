import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DisguiseEntryPage } from "../../src/pages/disguise/DisguiseEntryPage";
import { ApiError } from "../../src/api/client";

const apiMocks = vi.hoisted(() => ({
  getTodayFortune: vi.fn(),
  getDisguiseConfig: vi.fn(),
  verifyLuckyNumber: vi.fn()
}));

vi.mock("../../src/api/client", async () => {
  const actual = await vi.importActual<typeof import("../../src/api/client")>("../../src/api/client");
  return {
    ...actual,
    getTodayFortune: apiMocks.getTodayFortune,
    getDisguiseConfig: apiMocks.getDisguiseConfig,
    verifyLuckyNumber: apiMocks.verifyLuckyNumber
  };
});

describe("DisguiseEntryPage", () => {
  beforeEach(() => {
    apiMocks.getTodayFortune.mockResolvedValue({
      title: "今日运势",
      summary: "今天适合调整节奏。",
      luckyColor: "蓝色",
      luckyDirection: "东南",
      advice: "保持轻松，留意身边的小惊喜。"
    });
    apiMocks.getDisguiseConfig.mockResolvedValue({
      siteTitle: "今日运势",
      showFortuneInput: true,
      theme: "default"
    });
    apiMocks.verifyLuckyNumber.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does not expose high-risk keywords on initial render", async () => {
    render(
      <DisguiseEntryPage
        onLuckyNumberVerified={vi.fn()}
      />
    );

    await screen.findByRole("button", { name: "查看彩蛋" });

    const pageText = document.body.textContent ?? "";
    expect(pageText).not.toMatch(/聊天|隐藏|管理员|加密/);
  });

  it("keeps disguise wording when lucky number is incorrect", async () => {
    const user = userEvent.setup();
    apiMocks.verifyLuckyNumber.mockResolvedValue({ matched: false });

    render(
      <DisguiseEntryPage
        onLuckyNumberVerified={vi.fn()}
      />
    );

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "1111");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    expect(await screen.findByText("这个幸运数字暂未触发彩蛋，请再试一次")).toBeInTheDocument();
    expect(screen.getByText("未匹配到今日彩蛋，请检查后重试。")).toBeInTheDocument();

    const pageText = document.body.textContent ?? "";
    expect(pageText).not.toMatch(/聊天|隐藏|管理员|加密/);
  });

  it("keeps disguise wording after a correct lucky number", async () => {
    const user = userEvent.setup();
    const onLuckyNumberVerified = vi.fn();
    apiMocks.verifyLuckyNumber.mockResolvedValue({ matched: true });

    render(
      <DisguiseEntryPage
        onLuckyNumberVerified={onLuckyNumberVerified}
      />
    );

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    expect(await screen.findByText("幸运数字已匹配，正在打开今日彩蛋...")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/聊天|隐藏|管理员|加密/);

    await waitFor(() => expect(onLuckyNumberVerified).toHaveBeenCalledTimes(1));
  });

  it("keeps disguise wording for api verification errors", async () => {
    const user = userEvent.setup();
    apiMocks.verifyLuckyNumber.mockRejectedValue(new ApiError("bad code", { code: 420201, status: 400 }));

    render(
      <DisguiseEntryPage
        onLuckyNumberVerified={vi.fn()}
      />
    );

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "0000");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    expect(await screen.findByText("这个幸运数字暂未触发彩蛋，请再试一次")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/聊天|隐藏|管理员|加密/);
  });

  it("normalizes full-width digits and invisible whitespace before verification", async () => {
    const user = userEvent.setup();
    apiMocks.verifyLuckyNumber.mockResolvedValue({ matched: true });

    render(
      <DisguiseEntryPage
        onLuckyNumberVerified={vi.fn()}
      />
    );

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "　２４\u200B６８ ");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    await waitFor(() => {
      expect(apiMocks.verifyLuckyNumber).toHaveBeenCalledWith("2468");
    });
  });

  it("shows system error only for network failures", async () => {
    const user = userEvent.setup();
    apiMocks.verifyLuckyNumber.mockRejectedValue(
      new ApiError("network down", { status: 503, isNetworkError: true })
    );

    render(
      <DisguiseEntryPage
        onLuckyNumberVerified={vi.fn()}
      />
    );

    await screen.findByRole("button", { name: "查看彩蛋" });
    await user.type(screen.getByLabelText("请输入今日幸运数字"), "2468");
    await user.click(screen.getByRole("button", { name: "查看彩蛋" }));

    expect(await screen.findByText("校验失败，请稍后重试")).toBeInTheDocument();
    expect(screen.getByText("校验服务暂时不可用，请稍后重试。")).toBeInTheDocument();
  });
});
