"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EvaluationResult } from "@/lib/evaluation/evaluate-answer";

type Topic = { id: string; name: string; domain: string };
type Active = { sessionId: string; sessionQuestionId: string; questionText: string; framing: string; cacheHit: boolean };

export function DrillClient({ prepContextId, company, role, topics }: { prepContextId: string; company: string; role: string; topics: Topic[] }) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState("medium");
  const [active, setActive] = useState<Active | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true); setError(""); setEvaluation(null); setAnswer("");
    const response = await fetch("/api/sessions/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prepContextId, ontologyLeafId: topicId, difficulty }) });
    const result = await response.json();
    if (response.ok) setActive({ sessionId: result.sessionId, sessionQuestionId: result.sessionQuestionId, questionText: result.question.question_text, framing: result.runtimeContext.framing, cacheHit: result.cacheHit });
    else setError(result.error || "Could not start drill.");
    setBusy(false);
  }

  async function submit() {
    if (!active || !answer.trim()) return;
    setBusy(true); setError("");
    const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: active.sessionId, sessionQuestionId: active.sessionQuestionId, answer }) });
    const result = await response.json();
    if (response.ok) {
      setEvaluation(result.evaluation);
      if (result.followUp) {
        setActive((current) => current ? { ...current, sessionQuestionId: result.followUp.sessionQuestionId, questionText: result.followUp.questionText } : current);
        setAnswer("");
      }
    } else setError(result.error || "Could not evaluate answer.");
    setBusy(false);
  }

  if (!topics.length) return <Card className="glass-panel border-0"><CardContent className="py-12 text-center"><p className="text-muted-foreground">Select topics in your topic map before starting a drill.</p><Link href={`/app/topics/${prepContextId}`} className={buttonVariants({ className: "mt-5" })}>Open topic map</Link></CardContent></Card>;

  return <main className="space-y-6">
    <div><p className="text-sm font-medium text-primary">{company}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Adaptive drill</h1><p className="mt-2 text-muted-foreground">Practice for {role}; weak answers trigger a focused follow-up.</p></div>
    {!active && <Card className="glass-panel border-0"><CardHeader><CardTitle>Choose your focus</CardTitle><CardDescription>Questions are cache-first and context is injected at runtime.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-2">{topics.map((topic) => <button key={topic.id} type="button" onClick={() => setTopicId(topic.id)} className={`rounded-xl border p-4 text-left ${topicId === topic.id ? "border-primary bg-primary/10" : "bg-card/50"}`}><p className="font-medium">{topic.name}</p><p className="mt-1 text-xs text-muted-foreground">{topic.domain}</p></button>)}</div><div><Label htmlFor="difficulty">Difficulty</Label><select id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div><Button onClick={start} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}Start drill</Button></CardContent></Card>}
    {active && <Card className="glass-panel border-0"><CardHeader><div className="flex gap-2"><Badge>{difficulty}</Badge><Badge variant="outline">{active.cacheHit ? "Cache hit" : "Cache seeded"}</Badge></div><CardTitle className="mt-4 text-xl leading-8">{active.questionText}</CardTitle><CardDescription>{active.framing}</CardDescription></CardHeader><CardContent className="space-y-4"><Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Structure your answer, explain tradeoffs, risks, and validation…" className="min-h-56" /><Button onClick={submit} disabled={busy || !answer.trim()}>{busy ? <Loader2 className="animate-spin" /> : "Submit answer"}</Button></CardContent></Card>}
    {evaluation && <Card className="border-primary/25 bg-primary/5"><CardHeader><CardTitle className="flex items-center justify-between"><span className="flex items-center gap-2"><CheckCircle2 className="text-primary" />Evaluation</span><span>{evaluation.score}/100</span></CardTitle><CardDescription>{evaluation.feedback}</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div><h3 className="text-sm font-semibold">Strengths</h3><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{evaluation.strengths.map((item) => <li key={item}>✓ {item}</li>)}</ul></div><div><h3 className="text-sm font-semibold">Improve next</h3><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{evaluation.gaps.map((item) => <li key={item}>• {item}</li>)}</ul></div>{evaluation.needsFollowUp && <p className="sm:col-span-2 text-sm font-medium text-primary">A focused follow-up is ready above. Answer it to strengthen this skill.</p>}</CardContent></Card>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </main>;
}
