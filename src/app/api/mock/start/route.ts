import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedPrepContext } from "@/lib/owned-prep-context";
import { getCachedOrGenerateQuestion } from "@/lib/questions/cache";
import { injectRuntimeContext } from "@/lib/questions/runtime-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTopicMapCurrent } from "@/lib/topic-map/persist";

const schema = z.object({
  prepContextId: z.uuid(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  durationMinutes: z.union([z.literal(30), z.literal(60)]).default(30),
  roundType: z.enum(["recruiter", "hiring-manager", "behavioral", "skills", "final"]).default("hiring-manager"),
});

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function roundPrompt(roundType: z.infer<typeof schema>["roundType"], index: number, context: { company: string; role: string; resume_text: string | null }, skillName: string) {
  const prompts = {
    recruiter: [
      `Walk me through the parts of your background that best prepare you for the ${context.role} role at ${context.company}. Keep it focused and connect each example to the job.`,
      `Why this ${context.role} opportunity and why ${context.company} now? Give a specific answer rather than general enthusiasm.`,
      `Describe the accomplishment most relevant to ${skillName}. What was your individual contribution and measurable impact?`,
      `What is the largest gap between your current background and this role, and how are you closing it?`,
      `Tell me about the environment, manager, and responsibilities in which you do your best work.`,
      `What questions would you ask a recruiter to determine whether this role is genuinely a strong fit?`,
    ],
    behavioral: [
      `Tell me about a specific time you faced a difficult ${skillName} challenge. Answer in STAR format and make your individual actions and measurable result explicit.`,
      `Describe a disagreement with a senior stakeholder related to ${skillName}. How did you influence the decision, and what happened?`,
      `Tell me about a failure or missed expectation involving ${skillName}. What did you own, change, and learn?`,
      `Give an example of leading through ambiguity in ${skillName}. How did you create clarity for others?`,
      `Describe a decision where speed and quality were in tension. What tradeoff did you make and how did you validate it?`,
      `Tell me about feedback that changed how you operate. Show the before, the change, and the result.`,
    ],
    final: [
      `If you joined ${context.company} as a ${context.role}, what would you aim to learn, deliver, and influence in your first 90 days?`,
      `What is the most important strategic risk you would investigate first in this role, and how would you brief executive leadership?`,
      `Describe the operating principles you would use to make high-stakes decisions involving ${skillName}.`,
      `How would you align teams with conflicting incentives around ${skillName} while maintaining accountability?`,
      `What would outstanding performance in this role look like after one year, and which leading indicators would you track?`,
      `Make the closing case for why your background and judgment are a strong match for this role.`,
    ],
  } as const;
  if (roundType === "hiring-manager" || roundType === "skills") return null;
  const options = prompts[roundType];
  const base = options[index % options.length];
  return index >= options.length ? `${base} Use a different example than any earlier answer and go one level deeper on ${skillName}.` : base;
}

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid mock request." }, { status: 400 });
  const context = await getOwnedPrepContext(parsed.data.prepContextId);
  if (!context) return NextResponse.json({ error: "Prep context not found." }, { status: 404 });
  const admin = createSupabaseAdminClient();

  let treeId: string;
  try { treeId = await ensureTopicMapCurrent(context); }
  catch { return NextResponse.json({ error: "Could not refresh this role's interview topics." }, { status: 500 }); }

  const { data: mappings } = await admin.from("topic_skill_mappings").select("ontology_leaf_id, weight").eq("topic_tree_id", treeId).eq("selected", true).order("weight", { ascending: false }).limit(12);
  if (!mappings?.length) return NextResponse.json({ error: "Select at least one interview topic." }, { status: 409 });
  const { data: mappedSkills } = await admin.from("ontology_skills").select("id, name, domain").in("id", mappings.map((mapping) => mapping.ontology_leaf_id));
  const skillById = new Map((mappedSkills ?? []).map((skill) => [skill.id, skill]));
  const roundMappings = parsed.data.roundType === "behavioral"
    ? mappings.filter((mapping) => ["Leadership", "Analysis"].includes(skillById.get(mapping.ontology_leaf_id)?.domain ?? "") || mapping.ontology_leaf_id === "behavioral-leadership")
    : parsed.data.roundType === "recruiter"
      ? mappings.filter((mapping) => ["Leadership", "Analysis", "Risk & Compliance"].includes(skillById.get(mapping.ontology_leaf_id)?.domain ?? ""))
      : parsed.data.roundType === "skills"
        ? mappings.filter((mapping) => skillById.get(mapping.ontology_leaf_id)?.domain !== "Leadership")
        : mappings;
  const focusedMappings = roundMappings.length ? roundMappings : mappings;
  const questionCount = parsed.data.durationMinutes === 60 ? 12 : 6;
  const randomizedMappings = shuffle(focusedMappings);
  const scheduledLeafIds = Array.from({ length: questionCount }, (_, index) => randomizedMappings[index % randomizedMappings.length].ontology_leaf_id);
  const skillMap = new Map((mappedSkills ?? []).map((skill) => [skill.id, skill.name]));

  const { data: previousSessions } = await admin.from("practice_sessions").select("id").eq("prep_context_id", context.id).eq("mode", "mock");
  const previousSessionIds = (previousSessions ?? []).map((session) => session.id);
  const { data: previousQuestions } = previousSessionIds.length
    ? await admin.from("session_questions").select("question_id").in("session_id", previousSessionIds)
    : { data: [] as Array<{ question_id: string }> };
  const excludedQuestionIds = new Set((previousQuestions ?? []).map((item) => item.question_id));
  const prepared: Array<Awaited<ReturnType<typeof getCachedOrGenerateQuestion>>> = [];
  const indexesByLeaf = new Map<string, number[]>();
  scheduledLeafIds.forEach((leafId, index) => indexesByLeaf.set(leafId, [...(indexesByLeaf.get(leafId) ?? []), index]));
  await Promise.all([...indexesByLeaf.entries()].map(async ([ontologyLeafId, indexes]) => {
    const leafExclusions = new Set(excludedQuestionIds);
    for (const index of indexes) {
      const item = await getCachedOrGenerateQuestion({ ontologyLeafId, mode: "mock", difficulty: parsed.data.difficulty, excludeQuestionIds: [...leafExclusions] });
      leafExclusions.add(item.question.id);
      prepared[index] = item;
    }
  }));

  const { data: session, error } = await admin.from("practice_sessions").insert({
    prep_context_id: context.id,
    user_id: context.user_id,
    anonymous_session_id: context.anonymous_session_id,
    mode: "mock",
    difficulty: parsed.data.difficulty,
    duration_minutes: parsed.data.durationMinutes,
    planned_question_count: questionCount,
    interview_round: parsed.data.roundType,
  }).select("id, created_at").single();
  if (error || !session) return NextResponse.json({ error: "Could not start mock interview." }, { status: 500 });
  const overrides = scheduledLeafIds.map((leafId, index) => roundPrompt(parsed.data.roundType, index, context, skillMap.get(leafId) ?? "this role"));
  const { data: items, error: itemsError } = await admin.from("session_questions").insert(prepared.map((item, index) => ({ session_id: session.id, question_id: item.question.id, ontology_leaf_id: scheduledLeafIds[index], sequence_number: index + 1, prompt_override: overrides[index] }))).select("id, sequence_number, ontology_leaf_id, prompt_override");
  if (itemsError || !items) return NextResponse.json({ error: "Could not prepare interview round." }, { status: 500 });
  const questions = items.sort((a, b) => a.sequence_number - b.sequence_number).map((item, index) => ({
    sessionQuestionId: item.id,
    ...prepared[index].question,
    question_text: item.prompt_override ?? prepared[index].question.question_text,
    runtimeContext: injectRuntimeContext({ company: context.company, role: context.role, ontologyName: skillMap.get(item.ontology_leaf_id) ?? "interview skills", candidateBackground: context.resume_text, interviewRound: parsed.data.roundType }),
  }));
  return NextResponse.json({ ok: true, sessionId: session.id, startedAt: session.created_at, durationMinutes: parsed.data.durationMinutes, roundType: parsed.data.roundType, questionCount, questions });
}
