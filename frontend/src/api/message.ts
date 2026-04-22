import type { ChatMessage } from "../types";
import { requestJson } from "./http";

interface MessageHistoryResponse {
  list: Array<{
    messageId: string;
    conversationId: string;
    senderUid: string;
    receiverUid: string;
    messageType: string;
    payloadType?: string;
    payload: string;
    fileId?: string | null;
    clientMsgTime?: number | null;
    serverMsgTime: number;
    serverStatus?: string;
  }>;
  nextCursor?: string | null;
  hasMore: boolean;
}

function mapMessage(message: MessageHistoryResponse["list"][number]): ChatMessage {
  return {
    messageId: message.messageId,
    conversationId: message.conversationId,
    senderUid: message.senderUid,
    receiverUid: message.receiverUid,
    payload: message.payload,
    messageType: message.messageType,
    payloadType: message.payloadType,
    fileId: message.fileId,
    clientMsgTime: message.clientMsgTime,
    serverMsgTime: message.serverMsgTime,
    serverStatus: message.serverStatus
  };
}

export async function listMessageHistory(conversationId: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams({
    conversationId,
    pageSize: "50"
  });
  const history = await requestJson<MessageHistoryResponse>(`/message/history?${params.toString()}`, { method: "GET" }, true);
  return history.list.map(mapMessage).sort((left, right) => left.serverMsgTime - right.serverMsgTime);
}

export async function sendMessage(input: {
  messageId?: string;
  conversationId: string;
  receiverUid: string;
  payload: string;
  messageType?: "text" | "image" | "file";
  payloadType?: "text" | "plain" | "ref" | "encrypted";
  fileId?: string;
  clientMsgTime: number;
}): Promise<ChatMessage> {
  const message = await requestJson<MessageHistoryResponse["list"][number]>(
    "/message/send",
    {
      method: "POST",
      body: JSON.stringify({
        messageId: input.messageId,
        conversationId: input.conversationId,
        receiverUid: input.receiverUid,
        messageType: input.messageType ?? "text",
        payloadType: input.payloadType ?? (input.messageType === "text" || !input.messageType ? "plain" : "ref"),
        payload: input.payload,
        fileId: input.fileId,
        clientMsgTime: input.clientMsgTime
      })
    },
    true
  );
  return mapMessage(message);
}

export async function markMessagesRead(conversationId: string, messageIds: string[]): Promise<void> {
  await requestJson<void>(
    "/message/read",
    {
      method: "POST",
      body: JSON.stringify({ conversationId, messageIds })
    },
    true
  );
}
