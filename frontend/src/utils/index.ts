import type { ChatMessage, ContactItem, ConversationItem } from "../types";

export function createDemoContacts(): ContactItem[] {
  return [
    {
      peerUid: "u_demo_anna",
      peerNickname: "Anna",
      remarkName: "Anna",
      lastMessageAt: Date.now() - 60_000
    },
    {
      peerUid: "u_demo_mika",
      peerNickname: "Mika",
      remarkName: "Mika",
      lastMessageAt: Date.now() - 120_000
    }
  ];
}

export function createDemoConversations(): ConversationItem[] {
  return [
    {
      conversationId: "c_demo_1",
      peerUid: "u_demo_anna",
      remarkName: "Anna",
      lastMessagePreview: "[文本消息]",
      lastMessageAt: Date.now() - 60_000
    },
    {
      conversationId: "c_demo_2",
      peerUid: "u_demo_mika",
      remarkName: "Mika",
      lastMessagePreview: "[文本消息]",
      lastMessageAt: Date.now() - 120_000
    }
  ];
}

export function createDemoMessages(): Record<string, ChatMessage[]> {
  return {
    c_demo_1: [
      createMessage({
        conversationId: "c_demo_1",
        senderUid: "u_demo_anna",
        receiverUid: "u_frontend_demo",
        payload: "今晚只保留必要沟通，其他消息留到明天。"
      })
    ],
    c_demo_2: [
      createMessage({
        conversationId: "c_demo_2",
        senderUid: "u_demo_mika",
        receiverUid: "u_frontend_demo",
        payload: "图片链路等后端 file 接口联调后再接。"
      })
    ]
  };
}

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
    payloadType: input.payloadType ?? "text",
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
  return message.messageType === "text" ? "[文本消息]" : "[消息]";
}
