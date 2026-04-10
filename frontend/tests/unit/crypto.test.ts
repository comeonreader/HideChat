import { describe, expect, it } from "vitest";
import { deserializeMessageCache, serializeMessageCache, sha256Hex } from "../../src/crypto";

describe("crypto helpers", () => {
  it("hashes lucky code deterministically", async () => {
    const first = await sha256Hex("2468");
    const second = await sha256Hex("2468");
    expect(first).toHaveLength(64);
    expect(first).toBe(second);
  });

  it("serializes and deserializes cached messages", () => {
    const payload = {
      conversationId: "c_1001",
      messages: [{ messageId: "m_1001", payload: "hello" }]
    };
    expect(deserializeMessageCache<typeof payload>(serializeMessageCache(payload))).toEqual(payload);
  });
});
