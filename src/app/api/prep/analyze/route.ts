import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzePrepContext } from "@/lib/topic-map/analyze";
import { persistTopicAnalysis } from "@/lib/topic-map/persist";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("analyze").default("analyze"), prepContextId: z.uuid() }),
  z.object({ operation: z.literal("select"), prepContextId: z.uuid(), selectedTopicIds: z.array(z.string().min(1)).max(20) }),
]);

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("user-agent")
    ?? "unknown";
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(`prep-analyze:${clientKey(request)}`, 12, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Please wait a moment before analyzing again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid analysis request." }, { status: 400 });

  const context = await getOwnedPrepContext(parsed.data.prepContextId);
  if (!context) return NextResponse.json({ error: "Prep context not found." }, { status: 404 });

  const admin = createSupabaseAdminClient();
  if (parsed.data.operation === "select") {
    const { data: tree } = await admin
      .from("topic_trees")
      .select("id")
      .eq("prep_context_id", context.id)
      .maybeSingle();
    if (!tree) return NextResponse.json({ error: "Analyze this context before selecting topics." }, { status: 409 });

    const { error: clearError } = await admin.from("topic_skill_mappings").update({ selected: false }).eq("topic_tree_id", tree.id);
    if (clearError) return NextResponse.json({ error: "Could not update topic selection." }, { status: 500 });
    if (parsed.data.selectedTopicIds.length) {
      const { error } = await admin
        .from("topic_skill_mappings")
        .update({ selected: true })
        .eq("topic_tree_id", tree.id)
        .in("ontology_leaf_id", parsed.data.selectedTopicIds);
      if (error) return NextResponse.json({ error: "Could not update topic selection." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, selectedTopicIds: parsed.data.selectedTopicIds });
  }

  const analysis = analyzePrepContext({
    company: context.company,
    role: context.role,
    seniority: context.seniority,
    jobDescription: context.job_description,
  });
  try {
    const persisted = await persistTopicAnalysis(context, analysis);
    return NextResponse.json({ ok: true, topicTreeId: persisted.treeId, analysis: persisted.analysis });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save the topic map." }, { status: 500 });
  }
}
