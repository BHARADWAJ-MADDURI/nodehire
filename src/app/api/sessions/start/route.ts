import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { getCachedOrGenerateQuestion } from "@/lib/questions/cache";
import { injectRuntimeContext } from "@/lib/questions/runtime-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ prepContextId: z.uuid(), ontologyLeafId: z.string().min(1).max(100), difficulty: z.enum(["easy", "medium", "hard"]).default("medium") });

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid session request." }, { status: 400 });
  const context = await getOwnedPrepContext(parsed.data.prepContextId);
  if (!context) return NextResponse.json({ error: "Prep context not found." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  const { data: skill } = await admin.from("ontology_skills").select("name").eq("id", parsed.data.ontologyLeafId).maybeSingle();
  if (!skill) return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  const prepared = await getCachedOrGenerateQuestion({ ontologyLeafId: parsed.data.ontologyLeafId, mode: "drill", difficulty: parsed.data.difficulty });
  const { data: session, error } = await admin.from("practice_sessions").insert({
    prep_context_id: context.id,
    user_id: context.user_id,
    anonymous_session_id: context.anonymous_session_id,
    mode: "drill",
    difficulty: parsed.data.difficulty,
  }).select("id").single();
  if (error || !session) return NextResponse.json({ error: "Could not start drill." }, { status: 500 });
  const { data: item, error: itemError } = await admin.from("session_questions").insert({ session_id: session.id, question_id: prepared.question.id, ontology_leaf_id: parsed.data.ontologyLeafId, sequence_number: 1 }).select("id").single();
  if (itemError || !item) return NextResponse.json({ error: "Could not prepare drill question." }, { status: 500 });
  return NextResponse.json({ ok: true, sessionId: session.id, sessionQuestionId: item.id, question: prepared.question, cacheHit: prepared.cacheHit, runtimeContext: injectRuntimeContext({ company: context.company, role: context.role, ontologyName: skill.name }) });
}
