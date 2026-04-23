import { expect, test } from "@playwright/test";
import {
  createUniqueEmail,
  enterAuthFromDisguise,
  openApp,
  registerAndEnterChat,
  resetMockServer,
  submitLuckyNumber
} from "./support";

test.beforeEach(async ({ request }) => {
  await resetMockServer(request);
});

test("支持注册后直接进入聊天，并在刷新后无需 PIN 恢复使用", async ({ page }) => {
  const email = createUniqueEmail("pw-e2e");
  const password = "Abcd1234";

  await openApp(page);
  await enterAuthFromDisguise(page);
  await registerAndEnterChat(page, email, "Playwright", password);
  await expect(page.getByText("像微信一样熟悉的聊天列表")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("status")).toHaveCount(0);
  await submitLuckyNumber(page, "2468");
  await expect(page.getByRole("button", { name: /搜索 \/ 添加好友|添加好友/ })).toBeVisible();
  await expect(page.getByText("像微信一样熟悉的聊天列表")).toBeVisible();
  await expect(page.getByText("PIN 解锁")).toHaveCount(0);
});
