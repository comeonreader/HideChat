import { describe, expect, it } from "vitest";
import {
  buildFilePayload,
  getMaskedConversationPreview,
  markConversationMessageDelivery,
  matchesMessageSearch,
  normalizeIncomingMessage,
  parseFilePayload,
  resolveFileMessageType,
  upsertConversationMessages
} from "../../src/utils";

describe("chat-message utils", () => {
  it("normalizes incoming realtime messages", () => {
    expect(
      normalizeIncomingMessage({
        messageId: "m_1",
        conversationId: "c_1",
        senderUid: "u_1",
        receiverUid: "u_2",
        payload: "hello",
        messageType: "text",
        serverMsgTime: 1000
      })
    ).toEqual({
      messageId: "m_1",
      clientMessageId: null,
      conversationId: "c_1",
      senderUid: "u_1",
      receiverUid: "u_2",
      payload: "hello",
      messageType: "text",
      payloadType: undefined,
      fileId: null,
      clientMsgTime: null,
      serverMsgTime: 1000,
      serverStatus: undefined,
      deliveryStatus: undefined
    });
  });

  it("merges optimistic and acked messages by clientMessageId", () => {
    const merged = upsertConversationMessages(
      [
        {
          messageId: "local_cm_1",
          clientMessageId: "cm_1",
          conversationId: "c_1",
          senderUid: "u_1",
          receiverUid: "u_2",
          payload: "hello",
          messageType: "text",
          serverMsgTime: 1_000,
          deliveryStatus: "sending",
          serverStatus: "sending"
        }
      ],
      {
        messageId: "m_1",
        clientMessageId: "cm_1",
        conversationId: "c_1",
        senderUid: "u_1",
        receiverUid: "u_2",
        payload: "hello",
        messageType: "text",
        serverMsgTime: 1_100,
        deliveryStatus: "sent",
        serverStatus: "sent"
      }
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        messageId: "m_1",
        clientMessageId: "cm_1",
        deliveryStatus: "sent"
      })
    );
  });

  it("merges sync-recovered self messages by clientMsgTime when ack was lost", () => {
    const merged = upsertConversationMessages(
      [
        {
          messageId: "local_cm_sync_1",
          clientMessageId: "cm_sync_1",
          conversationId: "c_1",
          senderUid: "u_1",
          receiverUid: "u_2",
          payload: "hello",
          messageType: "text",
          clientMsgTime: 1_000,
          serverMsgTime: 1_000,
          deliveryStatus: "failed",
          serverStatus: "failed"
        }
      ],
      {
        messageId: "m_sync_1",
        conversationId: "c_1",
        senderUid: "u_1",
        receiverUid: "u_2",
        payload: "hello",
        messageType: "text",
        clientMsgTime: 1_000,
        serverMsgTime: 1_100,
        deliveryStatus: "sent",
        serverStatus: "delivered"
      }
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        messageId: "m_sync_1",
        clientMessageId: "cm_sync_1",
        deliveryStatus: "sent",
        serverStatus: "delivered"
      })
    );
  });

  it("marks message delivery status by clientMessageId", () => {
    const next = markConversationMessageDelivery(
      [
        {
          messageId: "local_cm_2",
          clientMessageId: "cm_2",
          conversationId: "c_1",
          senderUid: "u_1",
          receiverUid: "u_2",
          payload: "hello",
          messageType: "text",
          serverMsgTime: 1_000,
          deliveryStatus: "sending",
          serverStatus: "sending"
        }
      ],
      { clientMessageId: "cm_2" },
      "failed",
      { serverStatus: "failed" }
    );

    expect(next[0]).toEqual(
      expect.objectContaining({
        deliveryStatus: "failed",
        serverStatus: "failed"
      })
    );
  });

  it("serializes and parses file payloads for image and file messages", () => {
    const payload = buildFilePayload({
      fileId: "f_1",
      fileName: "hello.png",
      mimeType: "image/png",
      fileSize: 2048,
      accessUrl: "https://cdn.example.com/hello.png",
      downloadUrl: "https://cdn.example.com/hello.png?download=1",
      encryptFlag: false
    });

    expect(parseFilePayload(payload)).toEqual({
      fileId: "f_1",
      fileName: "hello.png",
      mimeType: "image/png",
      fileSize: 2048,
      accessUrl: "https://cdn.example.com/hello.png",
      downloadUrl: "https://cdn.example.com/hello.png?download=1"
    });
    expect(resolveFileMessageType("image/png")).toBe("image");
    expect(resolveFileMessageType("application/pdf")).toBe("file");
  });

  it("matches text and file metadata search and keeps masked previews stable", () => {
    expect(
      matchesMessageSearch(
        {
          messageId: "m_text",
          conversationId: "c_1",
          senderUid: "u_1",
          receiverUid: "u_2",
          payload: "隐藏聊天 hello",
          messageType: "text",
          serverMsgTime: 1000
        },
        "hello"
      )
    ).toBe(true);

    expect(
      matchesMessageSearch(
        {
          messageId: "m_file",
          conversationId: "c_1",
          senderUid: "u_1",
          receiverUid: "u_2",
          payload: JSON.stringify({
            fileName: "quarterly-report.pdf",
            mimeType: "application/pdf",
            accessUrl: "https://cdn.example.com/report.pdf"
          }),
          messageType: "file",
          serverMsgTime: 1000
        },
        "report"
      )
    ).toBe(true);

    expect(
      getMaskedConversationPreview(
        {
          conversationId: "c_1",
          peerUid: "u_2",
          remarkName: "Anna",
          previewStrategy: "masked",
          lastMessagePreview: "",
          lastMessageAt: 1000
        },
        {
          c_1: [
            {
              messageId: "m_file",
              conversationId: "c_1",
              senderUid: "u_1",
              receiverUid: "u_2",
              payload: "irrelevant",
              messageType: "file",
              serverMsgTime: 1000
            }
          ]
        }
      )
    ).toBe("[文件消息]");
  });
});
