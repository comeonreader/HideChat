import { encryptString, decryptString } from "../crypto";
import { saveCachedConversation, loadCachedConversation, type CachedConversationRecord } from "../storage";
import type { ChatMessage, KdfParams } from "../types";

export interface EncryptedMessageCache {
  conversationId: string;
  messages: ChatMessage[];
  lastUpdated: number;
  version: number;
}

export interface MessageCacheOptions {
  maxMessagesPerConversation?: number;
  cleanupInterval?: number;
  encryptionEnabled?: boolean;
}

const DEFAULT_OPTIONS: Required<MessageCacheOptions> = {
  maxMessagesPerConversation: 1000,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24小时
  encryptionEnabled: true
};

export class MessageEncryptionService {
  private options: Required<MessageCacheOptions>;
  private cleanupTimer?: NodeJS.Timeout;
  private encryptionKey?: string;
  private kdfParams?: KdfParams;

  constructor(options: MessageCacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 初始化加密服务
   */
  initialize(encryptionKey: string, kdfParams: KdfParams): void {
    this.encryptionKey = encryptionKey;
    this.kdfParams = kdfParams;
    this.startCleanupTimer();
  }

  /**
   * 设置加密密钥
   */
  setEncryptionKey(key: string, kdfParams: KdfParams): void {
    this.encryptionKey = key;
    this.kdfParams = kdfParams;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return !!this.encryptionKey && !!this.kdfParams;
  }

  /**
   * 加密消息缓存
   */
  private async encryptCache(cache: EncryptedMessageCache): Promise<string> {
    if (!this.encryptionKey || !this.kdfParams) {
      throw new Error("Encryption service not initialized");
    }

    const payload = JSON.stringify(cache);
    return await encryptString(this.encryptionKey, payload, this.kdfParams);
  }

  /**
   * 解密消息缓存
   */
  private async decryptCache(encrypted: string): Promise<EncryptedMessageCache> {
    if (!this.encryptionKey || !this.kdfParams) {
      throw new Error("Encryption service not initialized");
    }

    const decrypted = await decryptString(this.encryptionKey, encrypted, this.kdfParams);
    return JSON.parse(decrypted);
  }

  /**
   * 保存消息到本地缓存
   */
  async saveMessages(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<void> {
    if (!this.isInitialized()) {
      console.warn("Encryption service not initialized, skipping cache save");
      return;
    }

    try {
      // 限制消息数量
      const limitedMessages = messages.slice(-this.options.maxMessagesPerConversation);

      const cache: EncryptedMessageCache = {
        conversationId,
        messages: limitedMessages,
        lastUpdated: Date.now(),
        version: 1
      };

      let encryptedPayload: string;
      if (this.options.encryptionEnabled) {
        encryptedPayload = await this.encryptCache(cache);
      } else {
        // 如果不启用加密，仍然存储但标记为未加密
        encryptedPayload = JSON.stringify({
          ...cache,
          encrypted: false
        });
      }

      const record: CachedConversationRecord = {
        conversationId,
        encryptedPayload,
        updatedAt: Date.now()
      };

      await saveCachedConversation(record);
    } catch (error) {
      console.error("Failed to save messages to cache:", error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 从本地缓存加载消息
   */
  async loadMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!this.isInitialized()) {
      console.warn("Encryption service not initialized, skipping cache load");
      return [];
    }

    try {
      const record = await loadCachedConversation(conversationId);
      if (!record) {
        return [];
      }

      let cache: EncryptedMessageCache;
      
      if (this.options.encryptionEnabled) {
        try {
          cache = await this.decryptCache(record.encryptedPayload);
        } catch (decryptError) {
          // 如果解密失败，可能是旧版本或未加密的数据
          console.warn("Failed to decrypt cache, trying to parse as plain JSON:", decryptError);
          const parsed = JSON.parse(record.encryptedPayload);
          if (parsed.encrypted === false) {
            cache = parsed;
          } else {
            throw new Error("Cache is encrypted but decryption failed");
          }
        }
      } else {
        cache = JSON.parse(record.encryptedPayload);
      }

      // 验证缓存结构
      if (!cache.messages || !Array.isArray(cache.messages)) {
        console.warn("Invalid cache structure, returning empty messages");
        return [];
      }

      // 检查缓存是否过期（30天）
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - cache.lastUpdated > THIRTY_DAYS) {
        console.log("Cache expired, returning empty messages");
        return [];
      }

      return cache.messages;
    } catch (error) {
      console.error("Failed to load messages from cache:", error);
      return [];
    }
  }

  /**
   * 清除指定会话的缓存
   */
  async clearConversationCache(conversationId: string): Promise<void> {
    try {
      // 保存一个空的缓存记录来覆盖
      const record: CachedConversationRecord = {
        conversationId,
        encryptedPayload: "",
        updatedAt: Date.now()
      };
      await saveCachedConversation(record);
    } catch (error) {
      console.error("Failed to clear conversation cache:", error);
    }
  }

  /**
   * 清除所有过期的缓存
   */
  async cleanupExpiredCache(): Promise<void> {
    // 注意：由于 IndexedDB 的限制，我们无法直接遍历所有记录
    // 在实际应用中，可能需要维护一个会话列表
    console.log("Cleanup expired cache - this is a placeholder implementation");
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastCleanup: number;
  }> {
    // 注意：由于 IndexedDB 的限制，我们无法直接获取统计信息
    // 在实际应用中，可能需要维护统计信息
    return {
      totalConversations: 0,
      totalMessages: 0,
      lastCleanup: Date.now()
    };
  }

  /**
   * 启用/禁用加密
   */
  setEncryptionEnabled(enabled: boolean): void {
    this.options.encryptionEnabled = enabled;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredCache().catch(console.error);
    }, this.options.cleanupInterval);
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.encryptionKey = undefined;
    this.kdfParams = undefined;
  }
}

// 创建单例实例
export const messageEncryptionService = new MessageEncryptionService();