import { expect, test } from "@playwright/test";
import {
  createTinyPngBuffer,
  enterAuthFromDisguise,
  loginAndReachPin,
  openApp,
  resetMockServer,
  setPinAndEnter
} from "./support";

test.beforeEach(async ({ request }) => {
  await resetMockServer(request);
});

test("支持真实浏览器下的搜索用户、加好友、创建会话、文本消息收发与图片文件发送", async ({ page }) => {
  await openApp(page);
  await enterAuthFromDisguise(page);
  await loginAndReachPin(page, "reader@example.com", "Pass1234");
  await setPinAndEnter(page, "1357");
  await expect(page.getByText("已连接后端聊天通道，实时消息已启用。")).toBeVisible();

  await page.getByRole("button", { name: "搜索 / 添加好友" }).click();
  await page.getByPlaceholder("输入昵称或用户 ID").fill("Anna");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("ID: hide_2001")).toBeVisible();
  await page.getByPlaceholder("备注名（可选）").fill("安娜");
  await page.getByRole("button", { name: "添加", exact: true }).click();
  await expect(page.getByText("联系人已添加，并创建了单聊会话。")).toBeVisible();
  await expect(page.getByRole("button", { name: "返回列表" })).toBeVisible();

  const textMessage = `你好，真实浏览器 ${Date.now()}`;
  await page.getByLabel("消息输入框").fill(textMessage);
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByText(textMessage, { exact: true })).toBeVisible();
  await expect(page.getByText(`自动回复：${textMessage}`)).toBeVisible();

  await page.getByLabel("发送图片").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: createTinyPngBuffer()
  });
  await expect(page.getByAltText("photo.png")).toBeVisible();

  await page.getByLabel("发送文件").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("playwright file payload", "utf-8")
  });
  await expect(page.getByText("notes.txt", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "下载文件" })).toBeVisible();
});
