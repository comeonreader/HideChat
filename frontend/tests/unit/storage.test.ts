import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCachedConversations,
  deleteLocalSecret,
  listCachedConversations,
  loadLocalSecret,
  saveCachedConversation,
  saveLocalSecret
} from "../../src/storage";

describe("encrypted storage", () => {
  beforeEach(async () => {
    await clearCachedConversations();
    await deleteLocalSecret("pin:u_1001");
  });

  it("persists and lists cached conversations", async () => {
    await saveCachedConversation({
      conversationId: "c_1001",
      encryptedPayload: "ciphertext",
      updatedAt: 1_000
    });

    await expect(listCachedConversations()).resolves.toEqual([
      {
        conversationId: "c_1001",
        encryptedPayload: "ciphertext",
        updatedAt: 1_000
      }
    ]);
  });

  it("persists and removes local secret records", async () => {
    await saveLocalSecret({
      key: "pin:u_1001",
      verifierHash: "verifier",
      salt: "salt",
      kdfParams: {
        algorithm: "PBKDF2",
        hash: "SHA-256",
        iterations: 120_000,
        salt: "salt",
        keyLength: 32
      },
      createdAt: 1_000,
      updatedAt: 1_000
    });

    await expect(loadLocalSecret("pin:u_1001")).resolves.toMatchObject({
      key: "pin:u_1001",
      verifierHash: "verifier"
    });

    await deleteLocalSecret("pin:u_1001");
    await expect(loadLocalSecret("pin:u_1001")).resolves.toBeNull();
  });
});
