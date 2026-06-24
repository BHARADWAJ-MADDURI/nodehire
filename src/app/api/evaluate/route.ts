import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAnswer } from "@/lib/evaluation/evaluate-answer";
import { updatePracticeSignals } from "@/lib/evaluation/update-signals";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ sessionId: z.uuid(), sessionQuestionId: z.uuid(), answer: z.string().max(20_000).optional(), answerImage: z.string().max(3_000_000).optional() }).refine((value) => value.answer?.trim() || value.answerImage, "Answer is required.");

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Answer is required." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data: session } = await admin.from("practice_sessions").select("*").eq("id", parsed.data.sessionId).eq("status", "active").maybeSingle();
  if (!session || !await getOwnedPrepContext(session.prep_context_id)) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  const { data: item } = await admin.from("session_questions").select("*").eq("id", parsed.data.sessionQuestionId).eq("session_id", session.id).maybeSingle();
  if (!item || item.answered_at) return NextResponse.json({ error: "Question is unavailable or already answered." }, { status: 409 });
  const { data: skill } = await admin.from("ontology_skills").select("name").eq("id", item.ontology_leaf_id).single();
  const { data: question } = await admin.from("question_bank").select("answer_type, ideal_answer").eq("id", item.question_id).single();
  if (question?.answer_type === "diagram") {
    if (!parsed.data.answerImage?.startsWith("data:image/png;base64,")) return NextResponse.json({ error: "Couldn't read the diagram — try adding labels or more detail." }, { status: 400 });
    return NextResponse.json({ ok: true, evaluationSkipped: true, message: "Live vision evaluation needs an available AI tier. Compare your diagram with the ideal approach for this turn.", idealAnswer: question.ideal_answer });
  }
  const answer = parsed.data.answer?.trim() ?? "";
  const evaluation = evaluateAnswer(answer, skill?.name ?? "technical", question?.answer_type === "code" ? "code" : "text");
  await admin.from("session_questions").update({ answer_text: answer, score: evaluation.score, evaluation, answered_at: new Date().toISOString() }).eq("id", item.id);
  await updatePracticeSignals({ userId: session.user_id, anonymousSessionId: session.anonymous_session_id, ontologyLeafId: item.ontology_leaf_id, score: evaluation.score });

  let followUp = null;
  if (evaluation.needsFollowUp && evaluation.followUpPrompt) {
    const { data } = await admin.from("session_questions").insert({ session_id: session.id, question_id: item.question_id, ontology_leaf_id: item.ontology_leaf_id, sequence_number: item.sequence_number + 1, prompt_override: evaluation.followUpPrompt, is_follow_up: true }).select("id, prompt_override").single();
    followUp = data ? { sessionQuestionId: data.id, questionText: data.prompt_override } : null;
  } else {
    await admin.from("practice_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", session.id);
  }
  return NextResponse.json({ ok: true, evaluation, followUp });
}
