import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ sessionId: z.uuid() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data: session } = await admin.from("practice_sessions").select("id, prep_context_id, mode").eq("id", parsed.data.sessionId).maybeSingle();
  if (!session || !await getOwnedPrepContext(session.prep_context_id)) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  if (session.mode === "drill") await admin.from("session_questions").delete().eq("session_id", session.id).is("answered_at", null);
  await admin.from("practice_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", session.id);
  return NextResponse.json({ ok: true });
}
