import { expect, test } from "@playwright/test";
import { openApp, resetMockServer, submitLuckyNumber } from "./support";

test.beforeEach(async ({ request }) => {
  await resetMockServer(request);
});

test("幸运数字成功进入隐藏入口，失败时留在伪装链路", async ({ page }) => {
  await openApp(page);

  await submitLuckyNumber(page, "0000");
  await expect(page.getByLabel("请输入今日幸运数字")).toBeVisible();
  await expect(page.getByText("这个幸运数字暂未触发彩蛋，请再试一次")).toBeVisible();
  await expect(page.getByText("隐藏入口验证")).toHaveCount(0);

  await submitLuckyNumber(page, "2468");
  await expect(page.getByText("隐藏入口验证")).toBeVisible();
  await expect(page.getByRole("button", { name: "使用当前信息进入" })).toBeVisible();
});
