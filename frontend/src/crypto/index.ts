function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(buffer);
}

export function serializeMessageCache<T>(value: T): string {
  return JSON.stringify(value);
}

export function deserializeMessageCache<T>(value: string): T {
  return JSON.parse(value) as T;
}
