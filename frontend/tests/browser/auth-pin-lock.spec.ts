import { expect, test } from "@playwright/test";
import {
  createUniqueEmail,
  enterAuthFromDisguise,
  openApp,
  registerAndReachPin,
  resetMockServer,
  setPinAndEnter,
  submitLuckyNumber,
  unlockWithPin
} from "./support";

test.beforeEach(async ({ request }) => {
  await resetMockServer(request);
});

test("支持注册后设置 PIN，并覆盖自动锁定、重新解锁和刷新后重解锁", async ({ page }) => {
  const email = createUniqueEmail("pw-e2e");
  const password = "Abcd1234";
  const pin = "1357";

  await openApp(page);
  await enterAuthFromDisguise(page);
  await registerAndReachPin(page, email, "Playwright", password);
  await setPinAndEnter(page, pin);
  await expect(page.getByText("像微信一样熟悉的聊天列表")).toBeVisible();

  await page.waitForTimeout(1800);
  await expect(page.getByText("聊天已因长时间无操作自动锁定。")).toBeVisible();
  await expect(page.getByLabel("请输入今日幸运数字")).toBeVisible();

  await submitLuckyNumber(page, "2468");
  await unlockWithPin(page, pin);
  await expect(page.getByText("像微信一样熟悉的聊天列表")).toBeVisible();

  await page.reload();
  await expect(page.getByText("检测到本地登录态，输入幸运数字后可继续设置或输入 PIN。")).toBeVisible();
  await submitLuckyNumber(page, "2468");
  await unlockWithPin(page, pin);
  await expect(page.getByText("像微信一样熟悉的聊天列表")).toBeVisible();
});
