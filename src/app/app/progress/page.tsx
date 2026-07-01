import Link from "next/link";
import { Activity, ArrowRight, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { computeReadiness } from "@/lib/dashboard/readiness";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PrintReportButton } from "@/components/print-report-button";

function currentTimestamp() {
  return Date.now();
}

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ context?: string }> }) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const anonymous = auth.user ? null : await getAnonymousSession();
  const ownerColumn = auth.user ? "user_id" : "anonymous_session_id";
  const ownerId = auth.user?.id ?? anonymous?.id;
  if (!ownerId) return null;
  const admin = createSupabaseAdminClient();
  const [masteryResult, weaknessResult, contextsResult, sessionsResult] = await Promise.all([
    admin.from("skill_mastery").select("ontology_leaf_id, mastery_score, evidence_count").eq(ownerColumn, ownerId).order("mastery_score", { ascending: false }),
    admin.from("weakness_profiles").select("ontology_leaf_id, weakness_score, evidence_count").eq(ownerColumn, ownerId).order("weakness_score", { ascending: false }),
    admin.from("prep_contexts").select("id, company, role, interview_date").eq(ownerColumn, ownerId).order("updated_at", { ascending: false }),
    admin.from("practice_sessions").select("id, prep_context_id, status, difficulty, created_at").eq(ownerColumn, ownerId).order("created_at", { ascending: false }).limit(8),
  ]);
  const mastery = masteryResult.data ?? [];
  const weaknesses = weaknessResult.data ?? [];
  const contexts = contextsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const leafIds = Array.from(new Set([...mastery, ...weaknesses].map((item) => item.ontology_leaf_id)));
  const { data: skills } = leafIds.length ? await admin.from("ontology_skills").select("id, name, domain, parent_id").in("id", leafIds) : { data: [] };
  const parentIds = Array.from(new Set((skills ?? []).map((skill) => skill.parent_id).filter((id): id is string => Boolean(id))));
  const { data: parents } = parentIds.length ? await admin.from("ontology_skills").select("id, name, domain, parent_id").in("id", parentIds) : { data: [] };
  const skillNames = new Map((skills ?? []).map((skill) => [skill.id, skill]));
  const parentNames = new Map((parents ?? []).map((skill) => [skill.id, skill.name]));
  const skillLabel = (leafId: string) => {
    const skill = skillNames.get(leafId);
    return skill?.parent_id ? `${parentNames.get(skill.parent_id) ?? skill.domain} > ${skill.name}` : skill?.name ?? leafId;
  };
  const branchRollups = parentIds.map((parentId) => {
    const children = mastery.filter((item) => skillNames.get(item.ontology_leaf_id)?.parent_id === parentId);
    const evidence = children.reduce((sum, item) => sum + item.evidence_count, 0);
    const score = evidence ? children.reduce((sum, item) => sum + Number(item.mastery_score) * item.evidence_count, 0) / evidence : 0;
    return { id: parentId, name: parentNames.get(parentId) ?? parentId, score };
  }).filter((branch) => branch.score > 0);
  const masteryMap = new Map(mastery.map((item) => [item.ontology_leaf_id, Number(item.mastery_score)]));
  const activeContext = contexts.find((context) => context.id === params.context) ?? contexts[0];
  const contextSessions = activeContext ? sessions.filter((session) => session.prep_context_id === activeContext.id) : sessions;
  let readiness = { role: 0, jobDescription: 0, company: 0 };
  if (activeContext) {
    const { data: tree } = await admin.from("topic_trees").select("id").eq("prep_context_id", activeContext.id).maybeSingle();
    const { data: mappings } = tree ? await admin.from("topic_skill_mappings").select("ontology_leaf_id, weight").eq("topic_tree_id", tree.id).eq("selected", true) : { data: [] };
    readiness = computeReadiness(mappings ?? [], masteryMap);
  }
  const sessionIds = contextSessions.map((session) => session.id);
  const { data: answers } = sessionIds.length ? await admin.from("session_questions").select("score, answered_at, answer_text, ontology_leaf_id, evaluation").in("session_id", sessionIds).not("score", "is", null).order("answered_at", { ascending: true }) : { data: [] };
  const nextWeakness = weaknesses[0];
  const daysUntilInterview = activeContext?.interview_date ? Math.ceil((new Date(`${activeContext.interview_date}T12:00:00`).getTime() - currentTimestamp()) / 86_400_000) : null;
  const plan = daysUntilInterview === null
    ? ["Complete one three-question deep dive", "Retry the weakest skill", "Run one timed mock each week"]
    : daysUntilInterview <= 3
      ? ["Run one realistic mock today", "Review model answers for your two weakest skills", "Rehearse three concise STAR stories"]
      : daysUntilInterview <= 14
        ? ["Deep-dive one weak skill each day", "Run two stage-specific mocks this week", "Retry answers below 70 after reviewing feedback"]
        : ["Build breadth across the selected topic map", "Deep-dive two topics each week", "Add weekly mocks, then increase frequency in the final 14 days"];

  return <main className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Progress</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Interview readiness</h1><p className="mt-2 text-muted-foreground">{activeContext ? `${activeContext.role} at ${activeContext.company}` : "Portable mastery is stored; context readiness is calculated live."}</p></div><PrintReportButton /></div>
    {contexts.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Choose job context">{contexts.map((context) => <Link key={context.id} href={`/app/progress?context=${context.id}`} className={buttonVariants({ variant: context.id === activeContext?.id ? "default" : "outline", size: "sm" })}>{context.role} · {context.company}</Link>)}</div>}
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-muted-foreground"><strong className="text-foreground">How to read these scores:</strong> free baseline feedback is a low-confidence practice signal and contributes at 35% weight. AI-evaluated answers contribute at full weight. Readiness is guidance, not a hiring prediction.</div>
    <Card className="border-primary/25 bg-primary/5"><CardHeader><CardTitle>{daysUntilInterview === null ? "Your weekly preparation plan" : daysUntilInterview < 0 ? "Interview date has passed" : `${daysUntilInterview} day${daysUntilInterview === 1 ? "" : "s"} until interview`}</CardTitle><CardDescription>A practical next sequence based on your timeline and current evidence.</CardDescription></CardHeader><CardContent><ol className="grid gap-3 md:grid-cols-3">{plan.map((item, index) => <li key={item} className="rounded-xl border bg-background/60 p-4 text-sm"><span className="mr-2 font-semibold text-primary">{index + 1}.</span>{item}</li>)}</ol></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-3">{[["Role readiness", readiness.role], ["JD readiness", readiness.jobDescription], ["Company readiness", readiness.company]].map(([label, value]) => <Card key={String(label)} className="glass-panel border-0"><CardContent className="flex items-center gap-5 p-6"><div className="grid size-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${value}%, var(--muted) 0)` }}><div className="grid size-19 place-items-center rounded-full bg-card text-xl font-semibold">{value}%</div></div><div><CardDescription>{label}</CardDescription><CardTitle className="mt-2 text-lg">Live readiness</CardTitle></div></CardContent></Card>)}</div>
    <div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5 text-primary" />Portable skill scores</CardTitle></CardHeader><CardContent className="space-y-4">{branchRollups.map((branch) => <div key={branch.id} className="rounded-xl border bg-primary/5 p-3"><div className="flex justify-between text-sm font-semibold"><span>{branch.name} rollup</span><span>{Math.round(branch.score)}%</span></div></div>)}{mastery.length ? mastery.map((item) => <div key={item.ontology_leaf_id}><div className="flex justify-between text-sm"><span>{skillLabel(item.ontology_leaf_id)}</span><span>{Math.round(Number(item.mastery_score))}%</span></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.mastery_score}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">Complete a drill to establish your baseline.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-5 text-primary" />Weakness heatmap</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3">{weaknesses.length ? weaknesses.map((item) => <div key={item.ontology_leaf_id} className="rounded-xl border p-4" style={{ backgroundColor: `color-mix(in oklab, var(--destructive) ${Math.round(Number(item.weakness_score) * .22)}%, transparent)` }}><p className="text-sm font-medium">{skillLabel(item.ontology_leaf_id)}</p><p className="mt-1 text-xs text-muted-foreground">{Math.round(Number(item.weakness_score))}% attention</p></div>) : <p className="col-span-2 text-sm text-muted-foreground">Weakness signals appear after evaluated answers.</p>}</CardContent></Card></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-primary" />Answer trend</CardTitle></CardHeader><CardContent><div className="flex h-40 items-end gap-2">{(answers ?? []).map((answer, index) => <div key={index} className="min-w-5 flex-1 rounded-t bg-primary/80" style={{ height: `${Math.max(6, Number(answer.score))}%` }} title={`${answer.score}/100`} />)}{!answers?.length && <p className="self-center text-sm text-muted-foreground">Your answer scores will chart here.</p>}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Answer history and retries</CardTitle><CardDescription>Revisit low-scoring skills after reviewing the model answer.</CardDescription></CardHeader><CardContent className="space-y-3">{answers?.length ? [...answers].reverse().slice(0, 8).map((answer, index) => <div key={`${answer.answered_at}-${index}`} className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"><div><p className="line-clamp-1 text-sm font-medium">{skillLabel(answer.ontology_leaf_id)}</p><p className="mt-1 text-xs text-muted-foreground">{answer.score}/100 · {answer.answer_text ? `${answer.answer_text.split(/\s+/).length} words` : "Diagram response"}</p></div>{activeContext && <Link href={`/app/drill/${activeContext.id}?leaf=${answer.ontology_leaf_id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Retry skill</Link>}</div>) : <p className="text-sm text-muted-foreground">Completed answers will appear here.</p>}</CardContent></Card>
    <div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>Recent sessions</CardTitle></CardHeader><CardContent className="space-y-3">{contextSessions.map((session) => <div key={session.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>{activeContext?.role ?? "Practice"}</span><Badge variant="outline">{session.status}</Badge></div>)}</CardContent></Card><Card className="border-primary/25 bg-primary/5"><CardHeader><CardTitle>Recommended next drill</CardTitle><CardDescription>{nextWeakness ? `Strengthen ${skillLabel(nextWeakness.ontology_leaf_id)}.` : "Complete your first drill to get a recommendation."}</CardDescription></CardHeader><CardContent>{activeContext && <Link href={`/app/drill/${activeContext.id}?leaf=${nextWeakness?.ontology_leaf_id ?? ""}`} className={buttonVariants()}>Start recommended drill <ArrowRight /></Link>}</CardContent></Card></div>
  </main>;
}
