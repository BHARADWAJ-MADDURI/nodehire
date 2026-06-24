import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateQuestion } from "./generate";
import type { QuestionDifficulty, QuestionMode } from "./types";

export async function getCachedOrGenerateQuestion(input: {
  ontologyLeafId: string;
  mode: QuestionMode;
  difficulty: QuestionDifficulty;
}) {
  const admin = createSupabaseAdminClient();
  const { data: cached } = await admin
    .from("question_bank")
    .select("*")
    .eq("ontology_leaf_id", input.ontologyLeafId)
    .eq("mode", input.mode)
    .eq("difficulty", input.difficulty)
    .maybeSingle();

  if (cached) {
    await admin.from("question_bank").update({ hit_count: cached.hit_count + 1 }).eq("id", cached.id);
    return { question: cached, cacheHit: true };
  }

  const generated = generateQuestion(input);
  const { data, error } = await admin.from("question_bank").upsert({
    ontology_leaf_id: input.ontologyLeafId,
    mode: input.mode,
    difficulty: input.difficulty,
    question_text: generated.questionText,
    answer_type: generated.answerType,
    ideal_answer: generated.idealAnswer,
    evaluation_rubric: generated.evaluationRubric,
    follow_up_hints: generated.followUpHints,
    source: "deterministic-v1",
  }, { onConflict: "ontology_leaf_id,mode,difficulty" }).select("*").single();
  if (error || !data) throw new Error("Question cache write failed.");
  return { question: data, cacheHit: false };
}
