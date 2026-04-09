import { describe, expect, it } from "vitest";
import { decryptString, encryptString, sha256Hex } from "../../src/crypto";

describe("crypto helpers", () => {
  it("hashes lucky code deterministically", async () => {
    await expect(sha256Hex("2468")).resolves.toHaveLength(64);
  });

  it("encrypts and decrypts payload with pin", async () => {
    const encrypted = await encryptString("1357", "hidechat");
    await expect(decryptString("1357", encrypted)).resolves.toBe("hidechat");
  });
});
