export interface CachedConversationRecord {
  conversationId: string;
  encryptedPayload: string;
  updatedAt: number;
}

const DB_NAME = "hidechat-local";
const STORE_NAME = "conversation-cache";

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "conversationId" });
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
