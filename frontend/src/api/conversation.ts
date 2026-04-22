import type { ConversationItem } from "../types";
import { requestJson } from "./http";

export async function listConversations(): Promise<ConversationItem[]> {
  return requestJson<ConversationItem[]>("/conversation/list", { method: "GET" }, true);
}

export async function createSingleConversation(peerUid: string): Promise<ConversationItem> {
  return requestJson<ConversationItem>(
    "/conversation/single",
    {
      method: "POST",
      body: JSON.stringify({ peerUid })
    },
    true
  );
}

export async function clearConversationUnread(conversationId: string): Promise<void> {
  await requestJson<void>(
    "/conversation/clear-unread",
    {
      method: "POST",
      body: JSON.stringify({ conversationId })
    },
    true
  );
}
