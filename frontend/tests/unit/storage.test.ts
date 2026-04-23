import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCachedConversations,
  listCachedConversations,
  loadCachedConversation,
  saveCachedConversation
} from "../../src/storage";

describe("conversation storage", () => {
  beforeEach(async () => {
    await clearCachedConversations();
  });

  it("persists and lists cached conversations", async () => {
    await saveCachedConversation({
      conversationId: "c_1001",
      messages: [
        {
          messageId: "m_1001",
          clientMessageId: "cm_1001",
          conversationId: "c_1001",
          senderUid: "u_1001",
          receiverUid: "u_2001",
          payload: "hello",
          messageType: "text",
          serverMsgTime: 1_000,
          serverStatus: "delivered",
          deliveryStatus: "sent"
        }
      ],
      updatedAt: 1_000,
      lastSyncCursor: "sync_1000"
    });

    await expect(listCachedConversations()).resolves.toEqual([
      {
        conversationId: "c_1001",
        messages: [
          expect.objectContaining({
            messageId: "m_1001",
            clientMessageId: "cm_1001",
            payload: "hello"
          })
        ],
        updatedAt: 1_000,
        lastSyncCursor: "sync_1000"
      }
    ]);
  });

  it("loads a cached conversation without any PIN dependency", async () => {
    await saveCachedConversation({
      conversationId: "c_2001",
      messages: [
        {
          messageId: "m_2001",
          clientMessageId: "cm_2001",
          conversationId: "c_2001",
          senderUid: "u_1002",
          receiverUid: "u_1001",
          payload: "cached message",
          messageType: "text",
          serverMsgTime: 2_000,
          serverStatus: "read",
          deliveryStatus: "sent"
        }
      ],
      updatedAt: 2_000
    });

    await expect(loadCachedConversation("c_2001")).resolves.toEqual(
      expect.objectContaining({
        conversationId: "c_2001",
        messages: [
          expect.objectContaining({
            payload: "cached message"
          })
        ]
      })
    );
  });
});
