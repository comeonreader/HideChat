import { loadCachedConversation, saveCachedConversation } from "../storage";
import type { ChatMessage } from "../types";

export interface MessageCacheOptions {
  maxMessagesPerConversation?: number;
}

const DEFAULT_OPTIONS: Required<MessageCacheOptions> = {
  maxMessagesPerConversation: 1000
};

export class MessageEncryptionService {
  private options: Required<MessageCacheOptions>;

  constructor(options: MessageCacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
    await saveCachedConversation({
      conversationId,
      messages: messages.slice(-this.options.maxMessagesPerConversation),
      updatedAt: Date.now()
    });
  }

  async loadMessages(conversationId: string): Promise<ChatMessage[]> {
    const record = await loadCachedConversation(conversationId);
    return record?.messages ?? [];
  }
}

export const messageEncryptionService = new MessageEncryptionService();
