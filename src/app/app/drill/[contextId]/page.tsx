import { notFound } from "next/navigation";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DrillClient } from "./drill-client";

export default async function DrillPage({ params }: { params: Promise<{ contextId: string }> }) {
  const { contextId } = await params;
  const context = await getOwnedPrepContext(contextId);
  if (!context) notFound();
  const admin = createSupabaseAdminClient();
  const { data: tree } = await admin.from("topic_trees").select("id").eq("prep_context_id", context.id).maybeSingle();
  const { data: mappings } = tree ? await admin.from("topic_skill_mappings").select("ontology_leaf_id").eq("topic_tree_id", tree.id).eq("selected", true).order("weight", { ascending: false }) : { data: [] };
  const ids = (mappings ?? []).map((item) => item.ontology_leaf_id);
  const { data: skills } = ids.length ? await admin.from("ontology_skills").select("id, name, domain").in("id", ids) : { data: [] };
  return <DrillClient prepContextId={context.id} company={context.company} role={context.role} topics={skills ?? []} />;
}
