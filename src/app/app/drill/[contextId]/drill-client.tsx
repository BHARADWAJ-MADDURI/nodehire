"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mic, MicOff, Square, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EvaluationResult } from "@/lib/evaluation/evaluate-answer";
import { useSpeech } from "@/hooks/use-speech";
import { DiagramCanvas, type DiagramCanvasRef } from "@/components/diagram-canvas";
import { ProviderConnect } from "@/components/provider-connect";
import { getSessionProviderHeaders } from "@/lib/providers/client";
import { CodeWorkspace } from "@/components/code-workspace";

type Topic = { id: string; name: string; domain: string };
type Active = { sessionId: string; sessionQuestionId: string; questionText: string; framing: string; cacheHit: boolean; answerType: "text" | "code" | "diagram"; idealAnswer: string | null };
type PendingFollowUp = { sessionQuestionId: string; questionText: string };

export function DrillClient({ prepContextId, company, role, topics, authenticated, preselectedLeafId }: { prepContextId: string; company: string; role: string; topics: Topic[]; authenticated: boolean; preselectedLeafId?: string }) {
  const [topicId, setTopicId] = useState(topics.some((topic) => topic.id === preselectedLeafId) ? preselectedLeafId! : topics[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState("medium");
  const [active, setActive] = useState<Active | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selfGrade, setSelfGrade] = useState<string | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [idealAnswer, setIdealAnswer] = useState("");
  const [pendingFollowUp, setPendingFollowUp] = useState<PendingFollowUp | null>(null);
  const [needProvider, setNeedProvider] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState<"baseline" | "ai" | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const diagramRef = useRef<DiagramCanvasRef>(null);
  const speech = useSpeech(setAnswer);

  async function startForTopic(nextTopicId: string) {
    setBusy(true); setError(""); setEvaluation(null); setAnswer(""); setSubmittedAnswer(""); setIdealAnswer(""); setPendingFollowUp(null); setSelfGrade(null); setNeedProvider(false);
    setTopicId(nextTopicId); setEvaluationMode(null); setShowAdvanced(false);
    const response = await fetch("/api/sessions/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prepContextId, ontologyLeafId: nextTopicId, difficulty }) });
    const result = await response.json();
    if (response.ok) setActive({ sessionId: result.sessionId, sessionQuestionId: result.sessionQuestionId, questionText: result.question.question_text, framing: result.runtimeContext.framing, cacheHit: result.cacheHit, answerType: result.question.answer_type ?? "text", idealAnswer: result.question.ideal_answer });
    else setError(result.error || "Could not start drill.");
    setBusy(false);
  }

  async function start() {
    await startForTopic(topicId);
  }

  async function submit() {
    if (!active) return;
    const answerImage = active.answerType === "diagram" ? await diagramRef.current?.exportPng() : undefined;
    if (active.answerType === "diagram" && !answerImage) { setError("Your canvas is empty. Add labeled components before submitting."); return; }
    if (active.answerType !== "diagram" && !answer.trim()) return;
    setBusy(true); setError("");
    const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json", ...getSessionProviderHeaders() }, body: JSON.stringify({ sessionId: active.sessionId, sessionQuestionId: active.sessionQuestionId, answer, answerImage }) });
    const result = await response.json();
    if (response.ok) {
      setEvaluation(result.evaluation ?? null);
      setEvaluationMode(result.evaluationMode ?? null);
      setSubmittedAnswer(result.submittedAnswer ?? answer);
      setIdealAnswer(result.idealAnswer ?? active.idealAnswer ?? "");
      if (result.evaluationSkipped) setSelfGrade(result.idealAnswer || active.idealAnswer);
      setNeedProvider(result.code === "BYOK_REQUIRED" || result.code === "CEILING_REACHED");
      if (result.followUp) setPendingFollowUp(result.followUp);
    } else setError(result.error || "Could not evaluate answer.");
    setBusy(false);
  }

  function tryFollowUp() {
    if (!pendingFollowUp) return;
    setActive((current) => current ? { ...current, sessionQuestionId: pendingFollowUp.sessionQuestionId, questionText: pendingFollowUp.questionText } : current);
    setAnswer(""); setEvaluation(null); setSubmittedAnswer(""); setIdealAnswer(""); setPendingFollowUp(null);
  }

  async function nextQuestion() {
    if (active) await fetch("/api/sessions/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: active.sessionId }) });
    setActive(null); setAnswer(""); setEvaluation(null); setSubmittedAnswer(""); setIdealAnswer(""); setPendingFollowUp(null); setSelfGrade(null); setNeedProvider(false); setError("");
    const currentIndex = Math.max(0, topics.findIndex((topic) => topic.id === topicId));
    await startForTopic(topics[(currentIndex + 1) % topics.length]?.id ?? topicId);
  }

  if (!topics.length) return <Card className="glass-panel border-0"><CardContent className="py-12 text-center"><p className="text-muted-foreground">Select topics in your topic map before starting a drill.</p><Link href={`/app/topics/${prepContextId}`} className={buttonVariants({ className: "mt-5" })}>Open topic map</Link></CardContent></Card>;

  return <main className="space-y-6">
    <div><p className="text-sm font-medium text-primary">{company}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Adaptive drill</h1><p className="mt-2 text-muted-foreground">Practice for {role}; weak answers trigger a focused follow-up.</p></div>
    {!active && <Card className="glass-panel border-0"><CardHeader><CardTitle>Choose your focus</CardTitle><CardDescription>Questions are cache-first and context is injected at runtime.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-2">{topics.map((topic) => <button key={topic.id} type="button" onClick={() => setTopicId(topic.id)} className={`rounded-xl border p-4 text-left ${topicId === topic.id ? "border-primary bg-primary/10" : "bg-card/50"}`}><p className="font-medium">{topic.name}</p><p className="mt-1 text-xs text-muted-foreground">{topic.domain}</p></button>)}</div><div><Label htmlFor="difficulty">Difficulty</Label><select id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div><Button onClick={start} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}Start drill</Button></CardContent></Card>}
    {active && <Card className="glass-panel border-0"><CardHeader><div className="flex flex-wrap gap-2"><Badge>{difficulty}</Badge><Badge variant="outline">{active.cacheHit ? "Cache hit" : "Cache seeded"}</Badge><Badge variant="outline">{active.answerType}</Badge>{speech.isListening && <Badge className="animate-pulse">Listening — auto-stops after your pause</Badge>}</div><CardTitle className="mt-4 text-xl leading-8">{active.questionText}</CardTitle><CardDescription>{active.framing}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2">{speech.speechSupported && (speech.isSpeaking ? <Button type="button" variant="destructive" size="sm" onClick={speech.stopSpeaking}><Square />Stop question audio</Button> : <Button type="button" variant="outline" size="sm" onClick={() => speech.speak(active.questionText)}><Volume2 />Speak question naturally</Button>)}{active.answerType === "text" && speech.browserSupported && (speech.isListening ? <Button type="button" variant="destructive" size="sm" onClick={speech.stopListening}><MicOff />Stop now</Button> : <Button type="button" variant="outline" size="sm" onClick={() => speech.startListening(answer)}><Mic />Answer with voice</Button>)}</div>{active.answerType === "text" && !speech.browserSupported && <p role="status" className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">Voice input is not supported in this browser. Text input remains fully available; try current Chrome or Edge for microphone dictation.</p>}{speech.error && <p role="alert" className="text-sm text-destructive">{speech.error}</p>}{active.answerType === "diagram" ? <DiagramCanvas ref={diagramRef} /> : active.answerType === "code" ? <CodeWorkspace value={answer} onChange={setAnswer} /> : <><Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Speak or type your answer. You can edit the transcript before submitting…" className="min-h-56" /><p className="text-xs text-muted-foreground">Voice transcription auto-stops after a short pause and remains editable before submission.</p></>}<Button onClick={submit} disabled={busy || Boolean(evaluation) || (active.answerType !== "diagram" && !answer.trim())}>{busy ? <Loader2 className="animate-spin" /> : evaluation ? "Answer submitted" : "Submit answer"}</Button></CardContent></Card>}
    {evaluation && <Card className="border-primary/25 bg-primary/5"><CardHeader><CardTitle className="flex items-center justify-between"><span className="flex items-center gap-2"><CheckCircle2 className="text-primary" />{evaluationMode === "baseline" ? "Free baseline feedback" : "AI evaluation"}</span><span>{evaluation.score}/100</span></CardTitle><CardDescription>{evaluation.feedback}</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid gap-5 sm:grid-cols-2"><div><h3 className="text-sm font-semibold">Strengths</h3>{evaluation.strengths.length ? <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{evaluation.strengths.map((item) => <li key={item}>✓ {item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No demonstrated strengths in this response yet.</p>}</div><div><h3 className="text-sm font-semibold">Improve next</h3><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{evaluation.gaps.map((item) => <li key={item}>• {item}</li>)}</ul></div></div><div className="rounded-xl border bg-background/60 p-4"><h3 className="text-sm font-semibold">Your submitted answer</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{submittedAnswer}</p></div><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Model interview answer</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{idealAnswer || evaluation.betterInterviewAnswer}</p></div>{evaluationMode === "baseline" && <div className="rounded-xl border bg-background/60 p-4"><button type="button" className="text-sm font-medium text-primary" onClick={() => setShowAdvanced((value) => !value)}>Want deeper semantic coaching? Connect your own AI key (optional)</button>{showAdvanced && <div className="mt-4"><ProviderConnect authenticated={authenticated} compact /><p className="mt-3 text-xs text-muted-foreground">Advanced AI coaching will apply to your next answer. Free baseline feedback always remains available.</p></div>}</div>}<div className="flex flex-wrap gap-2">{pendingFollowUp && <Button onClick={tryFollowUp}>Try guided follow-up</Button>}<Button onClick={nextQuestion} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}Next question</Button></div></CardContent></Card>}
    {selfGrade && <Card className="border-amber-500/25 bg-amber-500/5"><CardHeader><CardTitle>Self-grade this turn</CardTitle><CardDescription>Live AI evaluation is unavailable. Your attempt was not scored.</CardDescription></CardHeader><CardContent className="space-y-5"><p className="text-sm leading-6 text-muted-foreground">{selfGrade}</p>{needProvider && <div className="rounded-xl border bg-background/70 p-4"><h3 className="mb-1 font-semibold">Optional: connect your API key for AI feedback</h3><p className="mb-3 text-xs text-muted-foreground">Your provider&apos;s pricing, free tier, and usage limits apply.</p><ProviderConnect authenticated={authenticated} compact /></div>}<div className="flex gap-2">{needProvider && <Button onClick={submit}>Evaluate after connecting</Button>}<Button variant="outline" onClick={nextQuestion}>Choose next question</Button></div></CardContent></Card>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </main>;
}
