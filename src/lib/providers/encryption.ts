import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { Json } from "@/types/database";
import type { ProviderName } from "./types";

type Envelope = { v: 1; iv: string; ciphertext: string; tag: string };
function key() {
  const raw = process.env.PROVIDER_KEY_ENCRYPTION_KEY;
  const buffer = raw ? Buffer.from(raw, "base64") : Buffer.alloc(0);
  if (buffer.length !== 32) throw new Error("PROVIDER_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return buffer;
}
export function encryptProviderKey(secret: string, userId: string, provider: ProviderName): Json {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(`${userId}:${provider}:v1`));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return { v: 1, iv: iv.toString("base64"), ciphertext: ciphertext.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
}
export function decryptProviderKey(value: Json, userId: string, provider: ProviderName) {
  const envelope = value as Envelope;
  if (envelope.v !== 1) throw new Error("Unsupported encrypted key version.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(envelope.iv, "base64"));
  decipher.setAAD(Buffer.from(`${userId}:${provider}:v1`));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]).toString("utf8");
}
