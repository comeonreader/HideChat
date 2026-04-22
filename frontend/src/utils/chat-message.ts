import type { ChatMessage, ContactItem, ConversationItem, FileInfo, RecentContactItem } from "../types";

export function normalizeIncomingMessage(data: unknown): ChatMessage {
  const raw = data as Record<string, unknown>;
  return {
    messageId: String(raw.messageId ?? `m_${Date.now()}`),
    conversationId: String(raw.conversationId ?? ""),
    senderUid: String(raw.senderUid ?? ""),
    receiverUid: String(raw.receiverUid ?? ""),
    payload: String(raw.payload ?? ""),
    messageType: String(raw.messageType ?? "text"),
    payloadType: raw.payloadType ? String(raw.payloadType) : undefined,
    fileId: raw.fileId ? String(raw.fileId) : null,
    clientMsgTime: raw.clientMsgTime == null ? null : Number(raw.clientMsgTime),
    serverMsgTime: Number(raw.serverMsgTime ?? Date.now()),
    serverStatus: raw.serverStatus ? String(raw.serverStatus) : undefined
  };
}

export function sortContacts(items: ContactItem[]): ContactItem[] {
  return [...items].sort((left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0));
}

export function sortRecentContacts(items: RecentContactItem[]): RecentContactItem[] {
  return [...items].sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0));
}

export function sortConversations(items: ConversationItem[]): ConversationItem[] {
  return [...items].sort((left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0));
}

export function buildFilePayload(file: FileInfo): string {
  return JSON.stringify({
    fileId: file.fileId,
    fileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    accessUrl: file.accessUrl,
    downloadUrl: file.downloadUrl
  });
}

export function parseFilePayload(payload: string): {
  fileName?: string;
  accessUrl?: string;
  downloadUrl?: string;
  fileSize?: number;
  mimeType?: string;
} | null {
  try {
    const parsed = JSON.parse(payload) as {
      fileName?: string;
      accessUrl?: string;
      downloadUrl?: string;
      fileSize?: number;
      mimeType?: string;
    };
    return parsed;
  } catch {
    return null;
  }
}

export function resolveFileMessageType(mimeType?: string): "image" | "file" {
  return mimeType?.startsWith("image/") ? "image" : "file";
}

export function extractTextPayload(payload: string): string {
  return payload;
}

export function removeMessage(messages: Record<string, ChatMessage[]>, target: ChatMessage): Record<string, ChatMessage[]> {
  return {
    ...messages,
    [target.conversationId]: (messages[target.conversationId] ?? []).filter((item) => item.messageId !== target.messageId)
  };
}

export function matchesMessageSearch(message: ChatMessage, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }
  if (message.messageType === "text") {
    return extractTextPayload(message.payload).toLowerCase().includes(normalizedKeyword);
  }
  const filePayload = parseFilePayload(message.payload);
  return [filePayload?.fileName, filePayload?.mimeType, filePayload?.downloadUrl, filePayload?.accessUrl]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedKeyword));
}

export function resolvePeerUid(message: ChatMessage, selfUserUid?: string): string {
  return message.senderUid === selfUserUid ? message.receiverUid : message.senderUid;
}

export function getConversationTitle(conversation: ConversationItem): string {
  return conversation.remarkName || conversation.peerNickname || conversation.peerUid;
}

export function getMaskedConversationPreview(
  conversation: ConversationItem,
  messagesByConversation: Record<string, ChatMessage[]>
): string {
  const conversationMessages = messagesByConversation[conversation.conversationId] ?? [];
  const lastMessage = conversationMessages[conversationMessages.length - 1];
  if (lastMessage?.messageType === "image") {
    return "[图片消息]";
  }
  if (lastMessage?.messageType === "file") {
    return "[文件消息]";
  }
  if (lastMessage?.messageType === "text") {
    return "[文本消息]";
  }
  return conversation.lastMessagePreview.startsWith("[") ? conversation.lastMessagePreview : "[文本消息]";
}
