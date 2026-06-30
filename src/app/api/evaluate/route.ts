import { NextResponse } from "next/server";
import { z } from "zod";
import { updatePracticeSignals } from "@/lib/evaluation/update-signals";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { idealAnswerFor } from "@/lib/questions/generate";
import { resolveProviderCredential } from "@/lib/providers/credential";
import { evaluateWithProvider } from "@/lib/providers/evaluate";
import { ProviderError } from "@/lib/providers/types";
import { evaluateAnswer, type EvaluationResult } from "@/lib/evaluation/evaluate-answer";

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
  const { data: question } = await admin.from("question_bank").select("answer_type, question_text, evaluation_rubric").eq("id", item.question_id).single();
  const idealAnswer = idealAnswerFor(item.ontology_leaf_id, skill?.name);
  const answer = parsed.data.answer?.trim() ?? "";
  if (question?.answer_type === "diagram" && !parsed.data.answerImage?.startsWith("data:image/png;base64,")) return NextResponse.json({ error: "Couldn't read the diagram — try adding labels or more detail." }, { status: 400 });
  const credential = await resolveProviderCredential(request, session.user_id);
  if (!credential && question?.answer_type === "diagram") return NextResponse.json({ ok: true, evaluationSkipped: true, code: "VISION_BYOK_OPTIONAL", message: "Diagram feedback needs a vision-capable AI. Compare with the model approach now, or optionally connect your key for advanced diagram coaching.", submittedAnswer: "Diagram submitted", idealAnswer });

  let evaluation: EvaluationResult;
  let evaluationMode: "baseline" | "ai" = "baseline";
  if (!credential) {
    evaluation = evaluateAnswer(answer, skill?.name ?? "interview", question?.answer_type === "code" ? "code" : "text");
  } else {
    try {
      const providerResult = await evaluateWithProvider({ provider: credential.provider, apiKey: credential.apiKey, source: credential.source, question: item.prompt_override ?? question?.question_text ?? "Interview question", answer, imageDataUrl: parsed.data.answerImage, rubric: question?.evaluation_rubric, answerType: question?.answer_type ?? "text" });
      if (providerResult.ceilingReached) {
        evaluation = evaluateAnswer(answer, skill?.name ?? "interview", question?.answer_type === "code" ? "code" : "text");
      } else if (!providerResult.result.readable) {
        return NextResponse.json({ ok: true, evaluationSkipped: true, code: "UNREADABLE_DIAGRAM", message: "Couldn't read the diagram — try adding labels or more detail. Your attempt was not scored.", submittedAnswer: "Diagram submitted", idealAnswer });
      } else {
        const result = providerResult.result;
        evaluationMode = "ai";
        evaluation = { score: Math.round(result.score), level: result.score >= 80 ? "strong" as const : result.score >= 55 ? "developing" as const : "needs-work" as const, strengths: result.strengths, gaps: result.gaps, feedback: result.feedback, needsFollowUp: result.score < 70, followUpPrompt: result.score < 70 ? `Try again after reviewing the model answer: explain the most important ${skill?.name ?? "technical"} decision and its tradeoff.` : null, estimatedComplexity: result.estimatedComplexity, notice: question?.answer_type === "code" ? "AI-assessed, not run against test cases. Complexity is estimated, not verified." : undefined, betterInterviewAnswer: result.betterInterviewAnswer };
      }
    } catch (error) {
      if (error instanceof ProviderError && credential.source === "byok") return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      if (question?.answer_type === "diagram") return NextResponse.json({ ok: true, evaluationSkipped: true, code: "PROVIDER_UNAVAILABLE", message: "Diagram evaluation is temporarily unavailable. Compare with the model approach for this turn.", submittedAnswer: "Diagram submitted", idealAnswer });
      evaluation = evaluateAnswer(answer, skill?.name ?? "interview", question?.answer_type === "code" ? "code" : "text");
    }
  }
  await admin.from("session_questions").update({ answer_text: answer, score: evaluation.score, evaluation, answered_at: new Date().toISOString() }).eq("id", item.id);
  await updatePracticeSignals({ userId: session.user_id, anonymousSessionId: session.anonymous_session_id, ontologyLeafId: item.ontology_leaf_id, score: evaluation.score });

  let followUp = null;
  let sessionComplete = false;
  if (session.mode === "drill" && evaluation.needsFollowUp && evaluation.followUpPrompt) {
    const { data } = await admin.from("session_questions").insert({ session_id: session.id, question_id: item.question_id, ontology_leaf_id: item.ontology_leaf_id, sequence_number: item.sequence_number + 1, prompt_override: evaluation.followUpPrompt, is_follow_up: true }).select("id, prompt_override").single();
    followUp = data ? { sessionQuestionId: data.id, questionText: data.prompt_override } : null;
  } else if (session.mode === "drill") {
    await admin.from("practice_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", session.id);
    sessionComplete = true;
  } else {
    const { count } = await admin.from("session_questions").select("id", { count: "exact", head: true }).eq("session_id", session.id).is("answered_at", null);
    if ((count ?? 0) === 0) {
      await admin.from("practice_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", session.id);
      sessionComplete = true;
    }
  }
  return NextResponse.json({ ok: true, evaluation, evaluationMode, advancedEvaluationAvailable: evaluationMode === "baseline", followUp, sessionComplete, submittedAnswer: answer, idealAnswer });
}
