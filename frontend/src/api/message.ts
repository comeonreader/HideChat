import type { ChatMessage, MessageSyncResponse } from "../types";
import { requestJson } from "./http";

interface MessageHistoryResponse {
  list: Array<{
    messageId: string;
    clientMessageId?: string | null;
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
    deliveryStatus?: "sending" | "sent" | "failed";
  }>;
  nextCursor?: string | null;
  hasMore: boolean;
}

interface MessageSyncApiResponse {
  messages: MessageHistoryResponse["list"];
  nextCursor?: string | null;
  hasMore: boolean;
}

function mapMessage(message: MessageHistoryResponse["list"][number]): ChatMessage {
  return {
    messageId: message.messageId,
    clientMessageId: message.clientMessageId ?? null,
    conversationId: message.conversationId,
    senderUid: message.senderUid,
    receiverUid: message.receiverUid,
    payload: message.payload,
    messageType: message.messageType,
    payloadType: message.payloadType,
    fileId: message.fileId,
    clientMsgTime: message.clientMsgTime,
    serverMsgTime: message.serverMsgTime,
    serverStatus: message.serverStatus,
    deliveryStatus: message.deliveryStatus
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
  clientMessageId?: string;
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
        clientMessageId: input.clientMessageId,
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

export async function syncMessages(input: {
  sinceCursor?: string | null;
  conversationIds?: string[];
  pageSize?: number;
}): Promise<MessageSyncResponse> {
  const params = new URLSearchParams();
  if (input.sinceCursor) {
    params.set("sinceCursor", input.sinceCursor);
  }
  if (input.pageSize) {
    params.set("pageSize", String(input.pageSize));
  }
  input.conversationIds?.filter(Boolean).forEach((conversationId) => {
    params.append("conversationIds", conversationId);
  });
  const response = await requestJson<MessageSyncApiResponse>(
    `/message/sync${params.size > 0 ? `?${params.toString()}` : ""}`,
    { method: "GET" },
    true
  );
  return {
    messages: response.messages.map(mapMessage).sort((left, right) => left.serverMsgTime - right.serverMsgTime),
    nextCursor: response.nextCursor ?? null,
    hasMore: response.hasMore
  };
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
