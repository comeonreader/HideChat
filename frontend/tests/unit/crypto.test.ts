import { describe, expect, it } from "vitest";
import { createSecretVerifier, decryptString, encryptString, sha256Hex, verifySecret } from "../../src/crypto";

describe("crypto helpers", () => {
  it("hashes lucky code deterministically", async () => {
    await expect(sha256Hex("2468")).resolves.toHaveLength(64);
  });

  it("encrypts and decrypts payload with pin", async () => {
    const verifier = await createSecretVerifier("1357");
    const encrypted = await encryptString("1357", "hidechat", verifier.kdfParams);
    await expect(decryptString("1357", encrypted, verifier.kdfParams)).resolves.toBe("hidechat");
  });

  it("rejects invalid pin against verifier", async () => {
    const verifier = await createSecretVerifier("1357");
    await expect(verifySecret("2468", verifier)).resolves.toBe(false);
  });
});
