import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const ANONYMOUS_COOKIE = "nodehire_anon";
export const ANONYMOUS_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret() {
  const secret = process.env.ANONYMOUS_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ANONYMOUS_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function hashAnonymousToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAnonymousCookieValue() {
  const token = randomBytes(32).toString("base64url");
  const signature = createHmac("sha256", sessionSecret())
    .update(token)
    .digest("base64url");
  return { token, value: `${token}.${signature}` };
}

export function verifyAnonymousCookieValue(value: string | undefined) {
  if (!value) return null;
  const [token, signature, extra] = value.split(".");
  if (!token || !signature || extra) return null;

  const expected = createHmac("sha256", sessionSecret())
    .update(token)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }
  return token;
}

export async function getAnonymousSession() {
  const cookieStore = await cookies();
  const token = verifyAnonymousCookieValue(
    cookieStore.get(ANONYMOUS_COOKIE)?.value,
  );
  if (!token) return null;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("anonymous_sessions")
    .select("id, expires_at")
    .eq("token_hash", hashAnonymousToken(token))
    .is("claimed_by", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return data;
}

export async function claimAnonymousSession(userId: string) {
  const session = await getAnonymousSession();
  if (!session) return 0;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("prep_contexts")
    .update({ user_id: userId, anonymous_session_id: null })
    .eq("anonymous_session_id", session.id)
    .select("id");

  if (error) throw error;

  await admin
    .from("anonymous_sessions")
    .update({ claimed_by: userId })
    .eq("id", session.id);

  const cookieStore = await cookies();
  cookieStore.delete(ANONYMOUS_COOKIE);
  return data?.length ?? 0;
}
