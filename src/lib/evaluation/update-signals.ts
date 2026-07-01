import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updatePracticeSignals(input: { userId: string | null; anonymousSessionId: string | null; ontologyLeafId: string; score: number; confidenceWeight?: number }) {
  const admin = createSupabaseAdminClient();
  const ownerColumn = input.userId ? "user_id" : "anonymous_session_id";
  const ownerId = input.userId ?? input.anonymousSessionId;
  if (!ownerId) throw new Error("Practice owner missing.");

  const confidenceWeight = input.confidenceWeight ?? 1;
  const confidenceAdjustedScore = Math.round(50 + (input.score - 50) * confidenceWeight);
  const { data: mastery } = await admin.from("skill_mastery").select("id, mastery_score, evidence_count").eq(ownerColumn, ownerId).eq("ontology_leaf_id", input.ontologyLeafId).maybeSingle();
  const masteryScore = mastery ? Math.round((mastery.mastery_score * mastery.evidence_count + confidenceAdjustedScore) / (mastery.evidence_count + 1)) : confidenceAdjustedScore;
  if (mastery) await admin.from("skill_mastery").update({ mastery_score: masteryScore, evidence_count: mastery.evidence_count + 1, updated_at: new Date().toISOString() }).eq("id", mastery.id);
  else await admin.from("skill_mastery").insert({ user_id: input.userId, anonymous_session_id: input.anonymousSessionId, ontology_leaf_id: input.ontologyLeafId, mastery_score: masteryScore, evidence_count: 1 });

  const { data: weakness } = await admin.from("weakness_profiles").select("id, weakness_score, evidence_count").eq(ownerColumn, ownerId).eq("ontology_leaf_id", input.ontologyLeafId).maybeSingle();
  const observation = 100 - confidenceAdjustedScore;
  const weaknessScore = weakness ? Math.round((weakness.weakness_score * weakness.evidence_count + observation) / (weakness.evidence_count + 1)) : observation;
  if (weakness) await admin.from("weakness_profiles").update({ weakness_score: weaknessScore, evidence_count: weakness.evidence_count + 1, updated_at: new Date().toISOString() }).eq("id", weakness.id);
  else await admin.from("weakness_profiles").insert({ user_id: input.userId, anonymous_session_id: input.anonymousSessionId, ontology_leaf_id: input.ontologyLeafId, weakness_score: weaknessScore, evidence_count: 1 });
}
