export interface CachedConversationRecord {
  conversationId: string;
  encryptedPayload: string;
  updatedAt: number;
}

export interface LocalSecretRecord {
  key: string;
  verifierHash: string;
  salt: string;
  kdfParams: {
    algorithm: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
    keyLength: number;
  };
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "hidechat-local";
const STORE_NAME = "conversation-cache";
const SECRET_STORE_NAME = "local-secrets";

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "conversationId" });
      }
      if (!database.objectStoreNames.contains(SECRET_STORE_NAME)) {
        database.createObjectStore(SECRET_STORE_NAME, { keyPath: "key" });
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

export async function saveLocalSecret(record: LocalSecretRecord): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(SECRET_STORE_NAME, "readwrite");
    transaction.objectStore(SECRET_STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadLocalSecret(key: string): Promise<LocalSecretRecord | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SECRET_STORE_NAME, "readonly");
    const request = transaction.objectStore(SECRET_STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as LocalSecretRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteLocalSecret(key: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(SECRET_STORE_NAME, "readwrite");
    transaction.objectStore(SECRET_STORE_NAME).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
