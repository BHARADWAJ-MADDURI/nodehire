import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { getCachedOrGenerateQuestion } from "@/lib/questions/cache";
import { injectRuntimeContext } from "@/lib/questions/runtime-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ prepContextId: z.uuid(), difficulty: z.enum(["easy", "medium", "hard"]).default("medium") });

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid mock request." }, { status: 400 });
  const context = await getOwnedPrepContext(parsed.data.prepContextId);
  if (!context) return NextResponse.json({ error: "Prep context not found." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  const { data: tree } = await admin.from("topic_trees").select("id").eq("prep_context_id", context.id).maybeSingle();
  if (!tree) return NextResponse.json({ error: "Generate a topic map first." }, { status: 409 });
  const { data: mappings } = await admin.from("topic_skill_mappings").select("ontology_leaf_id, weight").eq("topic_tree_id", tree.id).eq("selected", true).order("weight", { ascending: false }).limit(5);
  if (!mappings?.length) return NextResponse.json({ error: "Select at least one interview topic." }, { status: 409 });
  const leafIds = mappings.map((item) => item.ontology_leaf_id);
  const { data: skills } = await admin.from("ontology_skills").select("id, name").in("id", leafIds);
  const skillMap = new Map((skills ?? []).map((skill) => [skill.id, skill.name]));
  const prepared = await Promise.all(leafIds.map((ontologyLeafId) => getCachedOrGenerateQuestion({ ontologyLeafId, mode: "mock", difficulty: parsed.data.difficulty })));
  const { data: session, error } = await admin.from("practice_sessions").insert({ prep_context_id: context.id, user_id: context.user_id, anonymous_session_id: context.anonymous_session_id, mode: "mock", difficulty: parsed.data.difficulty }).select("id").single();
  if (error || !session) return NextResponse.json({ error: "Could not start mock interview." }, { status: 500 });
  const { data: items, error: itemsError } = await admin.from("session_questions").insert(prepared.map((item, index) => ({ session_id: session.id, question_id: item.question.id, ontology_leaf_id: leafIds[index], sequence_number: index + 1 }))).select("id, sequence_number, question_id, ontology_leaf_id");
  if (itemsError || !items) return NextResponse.json({ error: "Could not prepare interview round." }, { status: 500 });
  const questions = items.sort((a, b) => a.sequence_number - b.sequence_number).map((item, index) => ({
    sessionQuestionId: item.id,
    ...prepared[index].question,
    runtimeContext: injectRuntimeContext({ company: context.company, role: context.role, ontologyName: skillMap.get(item.ontology_leaf_id) ?? "interview skills" }),
  }));
  return NextResponse.json({ ok: true, sessionId: session.id, questions });
}
