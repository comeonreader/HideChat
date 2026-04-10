import { expect, type APIRequestContext, type Page } from "@playwright/test";

const mockBaseUrl = process.env.PLAYWRIGHT_MOCK_BASE_URL ?? "http://127.0.0.1:4174";

export function createUniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`;
}

export async function resetMockServer(request: APIRequestContext): Promise<void> {
  const response = await request.post(`${mockBaseUrl}/__test/reset`);
  expect(response.ok()).toBeTruthy();
}

export async function openApp(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "查看彩蛋" })).toBeVisible();
}

export async function submitLuckyNumber(page: Page, luckyNumber: string): Promise<void> {
  await page.getByLabel("请输入今日幸运数字").fill(luckyNumber);
  await page.getByRole("button", { name: "查看彩蛋" }).click();
}

export async function enterAuthFromDisguise(page: Page): Promise<void> {
  await submitLuckyNumber(page, "2468");
  await expect(page.getByText("隐藏入口验证")).toBeVisible();
}

export async function registerAndEnterChat(page: Page, email: string, nickname: string, password: string): Promise<void> {
  await page.getByRole("button", { name: "注册" }).click();
  await page.getByPlaceholder("邮箱").first().fill(email);
  await page.getByPlaceholder("昵称").fill(nickname);
  await page.getByPlaceholder("密码").fill(password);
  await page.getByPlaceholder("邮箱验证码").fill("123456");
  await page.getByRole("button", { name: "发送验证码" }).click();
  await expect(page.getByText("验证码已发送，请查收邮箱；如使用本地 MailPit，可在 http://localhost:8025 查看。")).toBeVisible();
  await page.getByRole("button", { name: "注册并进入" }).click();
  await expect(page.getByRole("button", { name: /搜索 \/ 添加好友|添加好友/ })).toBeVisible();
}

export async function loginAndEnterChat(page: Page, email: string, password: string): Promise<void> {
  await page.getByPlaceholder("邮箱").first().fill(email);
  await page.getByPlaceholder("密码").fill(password);
  await page.getByRole("button", { name: "使用当前信息进入" }).click();
  await expect(page.getByRole("button", { name: /搜索 \/ 添加好友|添加好友/ })).toBeVisible();
}

export function createTinyPngBuffer(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9l9WQAAAAASUVORK5CYII=",
    "base64"
  );
}
