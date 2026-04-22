import type { ChatMessage } from "../types";

export interface CachedConversationRecord {
  conversationId: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const DB_NAME = "hidechat-local";
const STORE_NAME = "conversation-cache";
const LEGACY_SECRET_STORE_NAME = "local-secrets";

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "conversationId" });
      }
      if (database.objectStoreNames.contains(LEGACY_SECRET_STORE_NAME)) {
        // 历史版本的本地 secret 存储已经废弃，升级时主动清理，避免旧明文/旧结构继续残留。
        database.deleteObjectStore(LEGACY_SECRET_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCachedConversation(record: CachedConversationRecord): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadCachedConversation(conversationId: string): Promise<CachedConversationRecord | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(conversationId);
    request.onsuccess = () => resolve((request.result as CachedConversationRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function listCachedConversations(): Promise<CachedConversationRecord[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as CachedConversationRecord[] | undefined) ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function clearCachedConversations(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
