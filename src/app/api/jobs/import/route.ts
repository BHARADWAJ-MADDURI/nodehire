import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { importJobUrl } from "@/lib/job-import";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ url: z.url().max(2_000) });
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data } = await supabase.auth.getUser();
  if (!data.user && !await getAnonymousSession()) return NextResponse.json({ error: "Start a free guest session or sign in first." }, { status: 401 });
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = consumeRateLimit(`job-import:${key}`, 8, 60_000); if (!limit.allowed) return NextResponse.json({ error: "Please wait before importing another link." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Enter a valid public job URL." }, { status: 400 });
  try { return NextResponse.json({ ok: true, job: await importJobUrl(parsed.data.url) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "The job could not be imported." }, { status: 422 }); }
}
