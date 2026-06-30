import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";
import { analyzePrepContext, type TopicAnalysis } from "./analyze";

export const TOPIC_MAP_VERSION = "ontology-v3";
type PrepContext = Database["public"]["Tables"]["prep_contexts"]["Row"];

export async function persistTopicAnalysis(context: PrepContext, analysis = analyzePrepContext({ company: context.company, role: context.role, seniority: context.seniority, jobDescription: context.job_description })) {
  const admin = createSupabaseAdminClient();
  const { data: tree, error: treeError } = await admin.from("topic_trees").upsert({
    prep_context_id: context.id,
    tree: analysis as unknown as Json,
    recommended_path: analysis.recommendedPath,
    signal_summary: { roleFamily: analysis.roleFamily, seniority: analysis.seniority, signals: analysis.signals },
    generated_by: TOPIC_MAP_VERSION,
  }, { onConflict: "prep_context_id" }).select("id").single();
  if (treeError || !tree) throw new Error("Could not save the topic map.");
  const leaves = analysis.branches.flatMap((branch) => branch.topics);
  const { error: deleteError } = await admin.from("topic_skill_mappings").delete().eq("topic_tree_id", tree.id);
  if (deleteError) throw new Error("Could not refresh topic mappings.");
  const { error: mappingError } = await admin.from("topic_skill_mappings").insert(leaves.map((leaf) => ({ topic_tree_id: tree.id, ontology_leaf_id: leaf.id, topic_key: leaf.id, weight: leaf.weight, selected: true, rationale: leaf.rationale })));
  if (mappingError) throw new Error("Could not save topic mappings.");
  return { treeId: tree.id, analysis: analysis as TopicAnalysis };
}

export async function ensureTopicMapCurrent(context: PrepContext) {
  const admin = createSupabaseAdminClient();
  const { data: tree } = await admin.from("topic_trees").select("id, generated_by").eq("prep_context_id", context.id).maybeSingle();
  if (tree?.generated_by === TOPIC_MAP_VERSION) return tree.id;
  return (await persistTopicAnalysis(context)).treeId;
}
