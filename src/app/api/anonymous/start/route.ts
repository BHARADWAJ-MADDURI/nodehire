import { NextResponse } from "next/server";
import {
  ANONYMOUS_COOKIE,
  ANONYMOUS_TTL_SECONDS,
  createAnonymousCookieValue,
  getAnonymousSession,
  hashAnonymousToken,
} from "@/lib/anonymous-session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const existingSession = await getAnonymousSession();
    if (existingSession) {
      return NextResponse.json({ ok: true, expiresAt: existingSession.expires_at });
    }

    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("user-agent") ??
      "unknown";
    const rateLimit = consumeRateLimit(`anonymous-start:${clientKey}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Please wait a moment before trying again." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

    const { token, value } = createAnonymousCookieValue();
    const expiresAt = new Date(Date.now() + ANONYMOUS_TTL_SECONDS * 1000);
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("anonymous_sessions").insert({
      token_hash: hashAnonymousToken(token),
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;

    const response = NextResponse.json({
      ok: true,
      expiresAt: expiresAt.toISOString(),
    });
    response.cookies.set(ANONYMOUS_COOKIE, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ANONYMOUS_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Demo mode is temporarily unavailable." },
      { status: 503 },
    );
  }
}
