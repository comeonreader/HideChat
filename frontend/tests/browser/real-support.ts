import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { openApp, setPinAndEnter, submitLuckyNumber, unlockWithPin } from "./support";

const gatewayBaseUrl = process.env.PLAYWRIGHT_REAL_BASE_URL ?? "http://127.0.0.1:5173";
const mailPitBaseUrl = process.env.PLAYWRIGHT_MAILPIT_BASE_URL ?? "http://127.0.0.1:8025";

interface TestUser {
  email: string;
  nickname: string;
  password: string;
  pin: string;
}

interface MailPitMessage {
  ID: string;
  Subject: string;
  Created?: string;
  To: Array<{ Address: string }>;
  Snippet?: string;
}

export function createRealUser(prefix: string): TestUser {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return {
    email: `${prefix}-${suffix}@example.com`,
    nickname: `${prefix}-${suffix.slice(-4)}`,
    password: "Abcd1234",
    pin: "1357"
  };
}

export async function registerUserViaApi(request: APIRequestContext, user: TestUser): Promise<string> {
  const sentAt = Date.now();
  const sendCodeResponse = await request.post(`${gatewayBaseUrl}/api/auth/email/send-code`, {
    data: {
      email: user.email,
      bizType: "register"
    }
  });
  expect(sendCodeResponse.ok()).toBeTruthy();

  const code = await waitForEmailCode(request, user.email, sentAt);
  const registerResponse = await request.post(`${gatewayBaseUrl}/api/auth/email/register`, {
    data: {
      email: user.email,
      nickname: user.nickname,
      password: user.password,
      emailCode: code
    }
  });
  const payload = await registerResponse.json();
  expect(payload.code).toBe(0);

  const loginResponse = await request.post(`${gatewayBaseUrl}/api/auth/email/password-login`, {
    data: {
      email: user.email,
      password: user.password
    }
  });
  const loginPayload = await loginResponse.json();
  expect(loginPayload.code).toBe(0);
  return loginPayload.data.accessToken as string;
}

export async function registerUserViaUi(page: Page, request: APIRequestContext, user: TestUser): Promise<void> {
  await openApp(page);
  await page.getByRole("button", { name: "今日运势" }).click();
  await expect(page.locator(".fortune-card h2")).toHaveText("今日运势");
  await page.getByRole("button", { name: "幸运数字", exact: true }).click();

  await submitLuckyNumber(page, "2468");
  await expect(page.getByText("隐藏入口验证")).toBeVisible();
  await page.getByRole("button", { name: "注册" }).click();
  await page.getByPlaceholder("邮箱").first().fill(user.email);
  await page.getByPlaceholder("昵称").fill(user.nickname);
  await page.getByPlaceholder("密码").fill(user.password);

  const sentAt = Date.now();
  await page.getByRole("button", { name: "发送验证码" }).click();
  await expect(page.getByText("验证码已发送，请查收邮箱；如使用本地 MailPit，可在 http://localhost:8025 查看。")).toBeVisible();

  const code = await waitForEmailCode(request, user.email, sentAt);
  await page.getByPlaceholder("邮箱验证码").fill(code);
  await page.getByRole("button", { name: "注册并进入" }).click();
  await expect(page.getByText("已连接后端账号，请继续设置或输入 PIN。")).toBeVisible();
  await setPinAndEnter(page, user.pin);
}

export async function loginUserViaUi(page: Page, user: TestUser): Promise<void> {
  await openApp(page);
  await submitLuckyNumber(page, "2468");
  await expect(page.getByText("隐藏入口验证")).toBeVisible();
  await page.getByPlaceholder("邮箱").first().fill(user.email);
  await page.getByPlaceholder("密码").fill(user.password);
  await page.getByRole("button", { name: "使用当前信息进入" }).click();
  await expect(page.getByText("已连接后端账号，请继续设置或输入 PIN。")).toBeVisible();
  await setPinAndEnter(page, user.pin);
}

export async function relockAndUnlock(page: Page, pin: string): Promise<void> {
  await page.getByRole("button", { name: "返回伪装页" }).click();
  await expect(page.getByLabel("请输入今日幸运数字")).toBeVisible();
  await submitLuckyNumber(page, "2468");
  await unlockWithPin(page, pin);
}

async function waitForEmailCode(request: APIRequestContext, email: string, sentAt: number): Promise<string> {
  for (let index = 0; index < 20; index += 1) {
    const response = await request.get(`${mailPitBaseUrl}/api/v1/messages`);
    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as { messages?: MailPitMessage[] };
    const matchedMessage = (payload.messages ?? []).find(
      (message) =>
        message.Subject === "[HideChat] 验证码"
        && message.To.some((recipient) => recipient.Address === email)
        && Date.parse(message.Created ?? "") >= sentAt - 1000
    );
    const matchedCode = matchedMessage?.Snippet?.match(/验证码：(\d{6})/)?.[1];
    if (matchedCode) {
      return matchedCode;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`MailPit 中未找到 ${email} 的验证码邮件`);
}
