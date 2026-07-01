import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { getCachedOrGenerateQuestion } from "@/lib/questions/cache";
import { injectRuntimeContext } from "@/lib/questions/runtime-context";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  prepContextId: z.uuid(),
  ontologyLeafId: z.string().min(1).max(100),
  mode: z.enum(["drill", "mock"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("user-agent") ?? "unknown";
  const limit = consumeRateLimit(`questions-next:${key}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Please slow down." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid question request." }, { status: 400 });

  const context = await getOwnedPrepContext(parsed.data.prepContextId);
  if (!context) return NextResponse.json({ error: "Prep context not found." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  const { data: tree } = await admin.from("topic_trees").select("id").eq("prep_context_id", context.id).maybeSingle();
  if (!tree) return NextResponse.json({ error: "Generate a topic map first." }, { status: 409 });
  const { data: mapping } = await admin
    .from("topic_skill_mappings")
    .select("ontology_leaf_id")
    .eq("topic_tree_id", tree.id)
    .eq("ontology_leaf_id", parsed.data.ontologyLeafId)
    .eq("selected", true)
    .maybeSingle();
  if (!mapping) return NextResponse.json({ error: "Select this topic before requesting questions." }, { status: 409 });
  const { data: skill } = await admin.from("ontology_skills").select("name").eq("id", mapping.ontology_leaf_id).single();
  if (!skill) return NextResponse.json({ error: "Ontology skill not found." }, { status: 404 });

  try {
    const result = await getCachedOrGenerateQuestion(parsed.data);
    return NextResponse.json({
      ok: true,
      cacheHit: result.cacheHit,
      cacheKey: {
        ontologyLeafId: parsed.data.ontologyLeafId,
        mode: parsed.data.mode,
        difficulty: parsed.data.difficulty,
      },
      question: result.question,
      runtimeContext: injectRuntimeContext({ company: context.company, role: context.role, ontologyName: skill.name, candidateBackground: context.resume_text }),
    });
  } catch {
    return NextResponse.json({ error: "A question could not be prepared." }, { status: 503 });
  }
}
