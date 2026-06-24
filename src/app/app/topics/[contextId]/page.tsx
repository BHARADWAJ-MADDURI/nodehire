import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TopicAnalysis } from "@/lib/topic-map/analyze";
import { TopicMapView } from "./topic-map-view";

export default async function TopicMapPage({ params }: { params: Promise<{ contextId: string }> }) {
  const { contextId } = await params;
  const context = await getOwnedPrepContext(contextId);
  if (!context) notFound();

  const admin = createSupabaseAdminClient();
  const { data: tree } = await admin
    .from("topic_trees")
    .select("id, tree, updated_at")
    .eq("prep_context_id", context.id)
    .maybeSingle();
  const { data: mappings } = tree
    ? await admin.from("topic_skill_mappings").select("ontology_leaf_id, selected").eq("topic_tree_id", tree.id)
    : { data: null };
  const selected = new Set((mappings ?? []).filter((item) => item.selected).map((item) => item.ontology_leaf_id));
  const analysis = tree?.tree as unknown as TopicAnalysis | undefined;
  if (analysis) {
    analysis.branches = analysis.branches.map((branch) => ({
      ...branch,
      topics: branch.topics.map((topic) => ({ ...topic, selected: selected.has(topic.id) })),
    }));
  }

  return (
    <main>
      <Link href="/app" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 mb-5" })}>← Prep contexts</Link>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{context.company}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{context.role} topic map</h1>
          <p className="mt-2 text-muted-foreground">Weighted from the role, job description, and portable skill ontology.</p>
        </div>
        <Link href={`/app/drill/${context.id}`} className={buttonVariants()}>Start adaptive drill</Link>
      </div>
      <TopicMapView prepContextId={context.id} initialAnalysis={analysis ?? null} />
    </main>
  );
}
