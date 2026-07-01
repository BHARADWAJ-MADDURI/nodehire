"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, Loader2, Mic, MicOff, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DiagramCanvas, type DiagramCanvasRef } from "@/components/diagram-canvas";
import { Textarea } from "@/components/ui/textarea";
import { useSpeech } from "@/hooks/use-speech";
import type { EvaluationResult } from "@/lib/evaluation/evaluate-answer";
import { getSessionProviderHeaders } from "@/lib/providers/client";
import { ProviderConnect } from "@/components/provider-connect";
import { CodeWorkspace } from "@/components/code-workspace";
import { PrintReportButton } from "@/components/print-report-button";

type Question = { sessionQuestionId: string; question_text: string; answer_type: "text" | "code" | "diagram"; ideal_answer: string | null; runtimeContext: { framing: string } };
type ReportItem = { question: string; score: number | null; feedback: string };
type RoundType = "recruiter" | "hiring-manager" | "behavioral" | "skills" | "final";
const roundOptions: Array<{ id: RoundType; label: string; description: string }> = [
  { id: "recruiter", label: "Recruiter screen", description: "Motivation, fit, communication, and role alignment" },
  { id: "hiring-manager", label: "Hiring manager", description: "Impact, judgment, ownership, and role depth" },
  { id: "behavioral", label: "Behavioral", description: "STAR stories, influence, conflict, and leadership" },
  { id: "skills", label: "Skills round", description: "Technical or domain-specific problem solving" },
  { id: "final", label: "Final round", description: "Cross-functional judgment and executive communication" },
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function MockInterviewClient({ prepContextId, company, role, authenticated }: { prepContextId: string; company: string; role: string; authenticated: boolean }) {
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(30);
  const [roundType, setRoundType] = useState<RoundType>("hiring-manager");
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [report, setReport] = useState<ReportItem[]>([]);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needProvider, setNeedProvider] = useState(false);
  const diagramRef = useRef<DiagramCanvasRef>(null);
  const answerStartedAt = useRef<number | null>(null);
  const speech = useSpeech(setAnswer);
  const { stopListening, stopSpeaking } = speech;
  const current = questions[index];

  useEffect(() => {
    if (answer && !answerStartedAt.current) answerStartedAt.current = Date.now();
  }, [answer]);

  useEffect(() => {
    if (!sessionId || !endsAt || complete) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        window.clearInterval(timer);
        stopListening();
        stopSpeaking();
        setComplete(true);
        void fetch("/api/sessions/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionId, endsAt, complete, stopListening, stopSpeaking]);

  async function start() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/mock/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prepContextId, difficulty: "medium", durationMinutes, roundType }) });
    const result = await response.json();
    if (response.ok) {
      setSessionId(result.sessionId);
      setQuestions(result.questions);
      setRemainingSeconds(result.durationMinutes * 60);
      setEndsAt(Date.now() + result.durationMinutes * 60_000);
      setIndex(0);
      setAnswer("");
      answerStartedAt.current = null;
      setEvaluation(null);
      setReport([]);
      setComplete(false);
      setNeedProvider(false);
    } else setError(result.error || "Could not start mock interview.");
    setBusy(false);
  }

  async function submit() {
    if (!current) return;
    const answerImage = current.answer_type === "diagram" ? await diagramRef.current?.exportPng() : undefined;
    if (current.answer_type === "diagram" && !answerImage) return setError("Add labeled components before submitting your diagram.");
    if (current.answer_type !== "diagram" && !answer.trim()) return;
    setBusy(true);
    setError("");
    speech.stopListening();
    speech.stopSpeaking();
    const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json", ...getSessionProviderHeaders() }, body: JSON.stringify({ sessionId, sessionQuestionId: current.sessionQuestionId, answer, answerImage, answerDurationSeconds: answerStartedAt.current ? Math.max(1, (Date.now() - answerStartedAt.current) / 1000) : undefined }) });
    const result = await response.json();
    if (response.ok) {
      const item = { question: current.question_text, score: result.evaluation?.score ?? null, feedback: result.evaluation?.feedback ?? result.message ?? "Compare your response with the model approach." };
      setEvaluation(result.evaluation ?? null);
      setReport((items) => [...items, item]);
      setNeedProvider(result.code === "VISION_BYOK_OPTIONAL" || result.code === "BYOK_REQUIRED" || result.code === "CEILING_REACHED");
      if (index === questions.length - 1) setComplete(true);
    } else setError(result.error || "Could not evaluate this answer.");
    setBusy(false);
  }

  function next() {
    speech.stopSpeaking();
    setIndex((value) => value + 1);
    setAnswer("");
    answerStartedAt.current = null;
    setEvaluation(null);
    setNeedProvider(false);
    setError("");
  }

  async function endInterview() {
    speech.stopListening();
    speech.stopSpeaking();
    setComplete(true);
    if (sessionId) await fetch("/api/sessions/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
  }

  function resetForAnotherRound() {
    setSessionId("");
    setQuestions([]);
    setIndex(0);
    setAnswer("");
    answerStartedAt.current = null;
    setEvaluation(null);
    setReport([]);
    setComplete(false);
    setNeedProvider(false);
    setRemainingSeconds(durationMinutes * 60);
    setEndsAt(null);
  }

  if (complete) {
    const scores = report.flatMap((item) => item.score === null ? [] : [item.score]);
    const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
    return <main className="space-y-6">
      <div><p className="text-sm font-medium text-primary">Interview report</p><h1 className="mt-2 text-3xl font-semibold">{role} at {company}</h1><p className="mt-2 text-muted-foreground">{roundOptions.find((round) => round.id === roundType)?.label} · {durationMinutes} minutes · {report.length} of {questions.length} questions completed</p></div>
      <Card className="glass-panel border-0"><CardHeader><CardDescription>Overall evaluated score</CardDescription><CardTitle className="text-4xl">{average === null ? "Model-answer review" : `${average}/100`}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button onClick={resetForAnotherRound}><RotateCcw />Start a new non-repeating round</Button><PrintReportButton /></CardContent></Card>
      <div className="space-y-3">{report.map((item, itemIndex) => <Card key={itemIndex}><CardHeader><div className="flex justify-between gap-4"><CardTitle className="text-base">Question {itemIndex + 1}</CardTitle><Badge variant="outline">{item.score === null ? "Not scored" : `${item.score}/100`}</Badge></div><CardDescription>{item.question}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">{item.feedback}</CardContent></Card>)}</div>
    </main>;
  }

  if (!current) return <main>
    <div><p className="text-sm font-medium text-primary">Mock interview</p><h1 className="mt-2 text-3xl font-semibold">{role} at {company}</h1><p className="mt-2 text-muted-foreground">A timed, JD-focused round that avoids questions from your previous mock interviews.</p></div>
    <Card className="glass-panel mt-8 border-0"><CardContent className="flex flex-col items-center py-14 text-center"><Play className="size-9 text-primary"/><h2 className="mt-4 text-xl font-semibold">Build your interview round</h2><p className="mt-2 text-sm text-muted-foreground">Choose the stage you are preparing for, then set the duration.</p>
      <div className="mt-6 grid w-full gap-3 md:grid-cols-2 xl:grid-cols-5">{roundOptions.map((round) => <button key={round.id} type="button" onClick={() => setRoundType(round.id)} className={`rounded-2xl border p-4 text-left transition ${roundType === round.id ? "border-primary bg-primary/10" : "bg-card/50"}`}><span className="font-semibold">{round.label}</span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{round.description}</span></button>)}</div>
      <div className="mt-6 grid w-full max-w-xl gap-3 sm:grid-cols-2">{([30, 60] as const).map((minutes) => <button key={minutes} type="button" onClick={() => { setDurationMinutes(minutes); setRemainingSeconds(minutes * 60); }} className={`rounded-2xl border p-5 text-left transition ${durationMinutes === minutes ? "border-primary bg-primary/10" : "bg-card/50"}`}><span className="flex items-center gap-2 font-semibold"><Clock3 className="size-4" />{minutes === 60 ? "1 hour" : "30 minutes"}</span><span className="mt-2 block text-sm text-muted-foreground">{minutes === 60 ? "12" : "6"} role-specific questions</span></button>)}</div>
      <Button className="mt-6" onClick={start} disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <Play/>}Begin timed interview</Button>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </CardContent></Card>
  </main>;

  return <main className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-primary">Question {index + 1} of {questions.length}</p><h1 className="mt-1 text-2xl font-semibold">Mock interview</h1></div><div className="flex items-center gap-2"><Badge variant={remainingSeconds < 300 ? "destructive" : "secondary"}><Clock3 />{formatTime(remainingSeconds)}</Badge><Badge>{current.answer_type}</Badge>{speech.isListening && <Badge className="animate-pulse">Listening — auto-stop</Badge>}</div></div>
    <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }}/></div>
    <Card className="glass-panel border-0"><CardHeader><CardTitle className="text-xl leading-8">{current.question_text}</CardTitle><CardDescription>{current.runtimeContext.framing}</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">{speech.speechSupported && (speech.isSpeaking ? <Button variant="destructive" size="sm" onClick={speech.stopSpeaking}><Square/>Stop question audio</Button> : <Button variant="outline" size="sm" onClick={() => speech.speak(current.question_text)}><Volume2/>Speak question naturally</Button>)}{current.answer_type === "text" && speech.browserSupported && (speech.isListening ? <Button variant="destructive" size="sm" onClick={speech.stopListening}><MicOff/>Stop now</Button> : <Button variant="outline" size="sm" onClick={() => speech.startListening(answer)}><Mic/>Answer with voice</Button>)}</div>
      {current.answer_type === "text" && !speech.browserSupported && <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Voice input is unavailable in this browser. Text input always remains available; try current Chrome or Edge.</p>}
      {speech.error && <p className="text-sm text-destructive">{speech.error}</p>}
      {current.answer_type === "diagram" ? <DiagramCanvas key={index} ref={diagramRef}/> : current.answer_type === "code" ? <CodeWorkspace value={answer} onChange={setAnswer} /> : <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} className="min-h-64" placeholder="Give your interview answer…"/>}
      {evaluation ? <div className="rounded-xl border bg-primary/5 p-4 text-sm"><strong>{evaluation.score}/100.</strong> {evaluation.feedback}</div> : !needProvider && <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : "Submit answer"}</Button>}
      {needProvider && <div className="rounded-xl border bg-background/70 p-4"><h3 className="mb-1 font-semibold">Optional: connect your API key for AI feedback</h3><p className="mb-3 text-xs text-muted-foreground">Your provider&apos;s pricing, free tier, and usage limits apply.</p><ProviderConnect authenticated={authenticated} compact /></div>}
      <div className="flex flex-wrap gap-2">{(evaluation || report.length === index + 1) && <Button onClick={next} disabled={index >= questions.length - 1}>Next question</Button>}<Button variant="ghost" onClick={endInterview}>End interview</Button></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </CardContent></Card>
  </main>;
}
