import type { ChatMessage } from "../types";
export * from "./chat-format";
export * from "./chat-message";

export function createMessage(input: {
  conversationId: string;
  senderUid: string;
  receiverUid: string;
  payload: string;
  messageType?: string;
  payloadType?: string;
  fileId?: string;
}): ChatMessage {
  return {
    messageId: `m_${Math.random().toString(36).slice(2, 10)}`,
    conversationId: input.conversationId,
    senderUid: input.senderUid,
    receiverUid: input.receiverUid,
    payload: input.payload,
    messageType: input.messageType ?? "text",
    payloadType: input.payloadType ?? "plain",
    fileId: input.fileId ?? null,
    clientMsgTime: Date.now(),
    serverMsgTime: Date.now(),
    serverStatus: "sending"
  };
}

export function buildMessagePreview(message: ChatMessage): string {
  if (message.messageType === "image") {
    return "[图片消息]";
  }
  if (message.messageType === "file") {
    return "[文件消息]";
  }
  return message.messageType === "text" ? "[文本消息]" : "[消息]";
}
