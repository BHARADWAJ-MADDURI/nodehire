import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateQuestion } from "./generate";
import type { QuestionDifficulty, QuestionMode } from "./types";

export function isLegacyVagueQuestion(question: { source?: string | null; question_text: string }) {
  return question.source === "deterministic-v1"
    || /how would you approach a realistic .+ problem/i.test(question.question_text)
    || /for this focused drill,\s*how would you approach/i.test(question.question_text);
}

export async function getCachedOrGenerateQuestion(input: {
  ontologyLeafId: string;
  mode: QuestionMode;
  difficulty: QuestionDifficulty;
  excludeQuestionIds?: string[];
}) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("question_bank")
    .select("*")
    .eq("ontology_leaf_id", input.ontologyLeafId)
    .eq("mode", input.mode)
    .eq("difficulty", input.difficulty)
    .order("hit_count", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1);
  if (input.excludeQuestionIds?.length) query = query.not("id", "in", `(${input.excludeQuestionIds.join(",")})`);
  const { data: cachedRows } = await query;
  const cached = cachedRows?.[0] ?? null;

  if (cached && !isLegacyVagueQuestion(cached)) {
    await admin.from("question_bank").update({ hit_count: cached.hit_count + 1 }).eq("id", cached.id);
    return { question: cached, cacheHit: true };
  }

  const { count: variantCount } = await admin.from("question_bank").select("id", { count: "exact", head: true }).eq("ontology_leaf_id", input.ontologyLeafId).eq("mode", input.mode).eq("difficulty", input.difficulty);
  const generated = generateQuestion({ ...input, variantIndex: variantCount ?? 0 });
  const payload = {
    ontology_leaf_id: input.ontologyLeafId,
    mode: input.mode,
    difficulty: input.difficulty,
    question_text: generated.questionText,
    answer_type: generated.answerType,
    ideal_answer: generated.idealAnswer,
    evaluation_rubric: generated.evaluationRubric,
    follow_up_hints: generated.followUpHints,
    source: "scenario-v2",
  };
  const write = cached
    ? admin.from("question_bank").update(payload).eq("id", cached.id)
    : admin.from("question_bank").insert(payload);
  const { data, error } = await write.select("*").single();
  if (error || !data) throw new Error("Question cache write failed.");
  return { question: data, cacheHit: false };
}
