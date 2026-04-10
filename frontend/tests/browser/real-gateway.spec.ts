import { expect, test, type APIRequestContext } from "@playwright/test";
import { createTinyPngBuffer } from "./support";
import {
  createRealUser,
  loginUserViaUi,
  registerUserViaApi,
  registerUserViaUi,
  reopenChatAfterDisguise
} from "./real-support";

test("真实网关入口下打通注册、密码登录、联系人、会话、文本消息、图片文件消息与直接恢复聊天", async ({ browser, page, request }) => {
  const userA = createRealUser("real-a");
  const userB = createRealUser("real-b");

  const accessTokenB = await registerUserViaApi(request, userB);
  await registerUserViaUi(page, request, userA);

  await page.getByRole("button", { name: "搜索 / 添加好友" }).click();
  await page.getByPlaceholder("输入昵称或用户 ID").fill(userB.nickname);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText(userB.nickname)).toBeVisible();
  await page.getByPlaceholder("备注名（可选）").fill("B Friend");
  await page.getByRole("button", { name: "添加", exact: true }).click();
  await expect(page.getByText("联系人已添加，并创建了单聊会话。")).toBeVisible();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await loginUserViaUi(pageB, userB);

  const textMessage = `real-message-${Date.now()}`;
  await page.getByLabel("消息输入框").fill(textMessage);
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByText(textMessage, { exact: true })).toBeVisible();
  const conversationId = await waitForConversationId(request, accessTokenB);
  await expect
    .poll(async () => {
      const historyResponse = await request.get(`/api/message/history?conversationId=${conversationId}&pageSize=20`, {
        headers: { Authorization: `Bearer ${accessTokenB}` }
      });
      const payload = await historyResponse.json();
      return payload.data.list.some((message: { payload: string }) => message.payload === textMessage);
    })
    .toBe(true);

  await page.getByLabel("发送图片").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: createTinyPngBuffer()
  });
  await expect
    .poll(async () => {
      const historyResponse = await request.get(`/api/message/history?conversationId=${conversationId}&pageSize=20`, {
        headers: { Authorization: `Bearer ${accessTokenB}` }
      });
      const payload = await historyResponse.json();
      return payload.data.list.some((message: { messageType: string }) => message.messageType === "image");
    })
    .toBe(true);

  await page.getByLabel("发送文件").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("real gateway file payload", "utf-8")
  });
  await expect
    .poll(async () => {
      const historyResponse = await request.get(`/api/message/history?conversationId=${conversationId}&pageSize=20`, {
        headers: { Authorization: `Bearer ${accessTokenB}` }
      });
      const payload = await historyResponse.json();
      return payload.data.list.some((message: { messageType: string; payload: string }) =>
        message.messageType === "file" && message.payload.includes("notes.txt")
      );
    })
    .toBe(true);

  await reopenChatAfterDisguise(page);
  if (await page.getByRole("button", { name: "进入聊天" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "进入聊天" }).click();
  }
  await expect(page.getByText(textMessage, { exact: true })).toBeVisible();
  await expect(page.getByText("notes.txt", { exact: true })).toBeVisible();

  await contextB.close();
});

async function waitForConversationId(request: APIRequestContext, accessToken: string): Promise<string> {
  let resolvedConversationId = "";
  await expect
    .poll(async () => {
      const response = await request.get("/api/conversation/list", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const payload = await response.json();
      resolvedConversationId = payload.data[0]?.conversationId ?? "";
      return resolvedConversationId;
    })
    .not.toBe("");
  return resolvedConversationId;
}
