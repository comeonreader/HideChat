import { describe, expect, it } from "vitest";
import {
  buildFilePayload,
  getMaskedConversationPreview,
  matchesMessageSearch,
  normalizeIncomingMessage,
  parseFilePayload,
  resolveFileMessageType
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
      conversationId: "c_1",
      senderUid: "u_1",
      receiverUid: "u_2",
      payload: "hello",
      messageType: "text",
      payloadType: undefined,
      fileId: null,
      clientMsgTime: null,
      serverMsgTime: 1000,
      serverStatus: undefined
    });
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
