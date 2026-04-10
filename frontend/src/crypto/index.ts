import type { KdfParams, SecretVerifierRecord } from "../types";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const DEFAULT_PBKDF2_ITERATIONS = 120_000;
const DEFAULT_AES_KEY_LENGTH = 32;

function createRandomSalt(length = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function importSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveBits", "deriveKey"]);
}

async function deriveBits(secret: string, kdfParams: KdfParams): Promise<ArrayBuffer> {
  const keyMaterial = await importSecret(secret);
  const salt = toArrayBuffer(fromBase64(kdfParams.salt));
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: kdfParams.hash,
      salt,
      iterations: kdfParams.iterations
    },
    keyMaterial,
    kdfParams.keyLength * 8
  );
}

async function deriveEncryptionKey(secret: string, kdfParams: KdfParams): Promise<CryptoKey> {
  const keyMaterial = await importSecret(secret);
  const salt = toArrayBuffer(fromBase64(kdfParams.salt));
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: kdfParams.hash,
      salt,
      iterations: kdfParams.iterations
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: kdfParams.keyLength * 8
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(buffer);
}

export function createKdfParams(salt = createRandomSalt()): KdfParams {
  const saltBytes = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
  return {
    algorithm: "PBKDF2",
    hash: "SHA-256",
    iterations: DEFAULT_PBKDF2_ITERATIONS,
    salt: toBase64(saltBytes),
    keyLength: DEFAULT_AES_KEY_LENGTH
  };
}

export async function createSecretVerifier(secret: string, existingParams?: KdfParams): Promise<SecretVerifierRecord> {
  const kdfParams = existingParams ?? createKdfParams();
  const derivedBits = await deriveBits(secret, kdfParams);
  const verifierHash = await sha256Hex(toHex(derivedBits));
  const timestamp = Date.now();
  return {
    verifierHash,
    salt: kdfParams.salt,
    kdfParams,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function verifySecret(secret: string, verifier: Pick<SecretVerifierRecord, "verifierHash" | "kdfParams">): Promise<boolean> {
  const derivedBits = await deriveBits(secret, verifier.kdfParams);
  const candidate = await sha256Hex(toHex(derivedBits));
  return candidate === verifier.verifierHash;
}

export async function encryptString(secret: string, value: string, kdfParams: KdfParams): Promise<string> {
  const key = await deriveEncryptionKey(secret, kdfParams);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value)
  );
  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), iv.length);
  return toBase64(payload);
}

export async function decryptString(secret: string, encryptedValue: string, kdfParams: KdfParams): Promise<string> {
  const key = await deriveEncryptionKey(secret, kdfParams);
  const payload = fromBase64(encryptedValue);
  const iv = payload.slice(0, 12);
  const data = payload.slice(12);
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plainBuffer);
}
