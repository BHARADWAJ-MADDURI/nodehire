"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, MicOff, Play, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DiagramCanvas, type DiagramCanvasRef } from "@/components/diagram-canvas";
import { Textarea } from "@/components/ui/textarea";
import { useSpeech } from "@/hooks/use-speech";
import type { EvaluationResult } from "@/lib/evaluation/evaluate-answer";

type Question = { sessionQuestionId: string; question_text: string; answer_type: "text" | "code" | "diagram"; ideal_answer: string | null; runtimeContext: { framing: string } };
type ReportItem = { question: string; score: number | null; feedback: string };

export function MockInterviewClient({ prepContextId, company, role }: { prepContextId: string; company: string; role: string }) {
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [report, setReport] = useState<ReportItem[]>([]);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const diagramRef = useRef<DiagramCanvasRef>(null);
  const speech = useSpeech(setAnswer);
  const current = questions[index];

  async function start() {
    setBusy(true); setError("");
    const response = await fetch("/api/mock/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prepContextId, difficulty: "medium" }) });
    const result = await response.json();
    if (response.ok) { setSessionId(result.sessionId); setQuestions(result.questions); } else setError(result.error || "Could not start mock interview.");
    setBusy(false);
  }
  async function submit() {
    if (!current) return;
    const answerImage = current.answer_type === "diagram" ? await diagramRef.current?.exportPng() : undefined;
    if (current.answer_type === "diagram" && !answerImage) return setError("Add labeled components before submitting your diagram.");
    if (current.answer_type !== "diagram" && !answer.trim()) return;
    setBusy(true); setError(""); speech.stopListening();
    const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, sessionQuestionId: current.sessionQuestionId, answer, answerImage }) });
    const result = await response.json();
    if (response.ok) {
      const item = { question: current.question_text, score: result.evaluation?.score ?? null, feedback: result.evaluation?.feedback ?? result.message ?? "Self-grade against the ideal approach." };
      setEvaluation(result.evaluation ?? null); setReport((items) => [...items, item]);
      if (index === questions.length - 1) setComplete(true);
    } else setError(result.error || "Could not evaluate this answer.");
    setBusy(false);
  }
  function next() { setIndex((value) => value + 1); setAnswer(""); setEvaluation(null); setError(""); }

  if (complete) {
    const scores = report.flatMap((item) => item.score === null ? [] : [item.score]);
    const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
    return <main className="space-y-6"><div><p className="text-sm font-medium text-primary">Interview report</p><h1 className="mt-2 text-3xl font-semibold">{role} at {company}</h1></div><Card className="glass-panel border-0"><CardHeader><CardDescription>Overall evaluated score</CardDescription><CardTitle className="text-4xl">{average === null ? "Self-grade" : `${average}/100`}</CardTitle></CardHeader></Card><div className="space-y-3">{report.map((item, itemIndex) => <Card key={itemIndex}><CardHeader><div className="flex justify-between gap-4"><CardTitle className="text-base">Question {itemIndex + 1}</CardTitle><Badge variant="outline">{item.score === null ? "Not scored" : `${item.score}/100`}</Badge></div><CardDescription>{item.question}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">{item.feedback}</CardContent></Card>)}</div></main>;
  }
  if (!current) return <main><div><p className="text-sm font-medium text-primary">Mock interview</p><h1 className="mt-2 text-3xl font-semibold">{role} at {company}</h1><p className="mt-2 text-muted-foreground">A multi-topic round using your selected ontology leaves and company context.</p></div><Card className="glass-panel mt-8 border-0"><CardContent className="flex flex-col items-center py-14 text-center"><Play className="size-9 text-primary"/><h2 className="mt-4 text-xl font-semibold">Ready for a realistic round?</h2><p className="mt-2 text-sm text-muted-foreground">Questions are cache-first; every response uses the shared evaluator.</p><Button className="mt-6" onClick={start} disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <Play/>}Start mock interview</Button>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}</CardContent></Card></main>;

  return <main className="space-y-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Question {index + 1} of {questions.length}</p><h1 className="mt-1 text-2xl font-semibold">Mock interview</h1></div><Badge>{current.answer_type}</Badge></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }}/></div><Card className="glass-panel border-0"><CardHeader><CardTitle className="text-xl leading-8">{current.question_text}</CardTitle><CardDescription>{current.runtimeContext.framing}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex gap-2">{speech.speechSupported && <Button variant="outline" size="sm" onClick={() => speech.speak(current.question_text)}><Volume2/>Speak question</Button>}{current.answer_type === "text" && speech.browserSupported && (speech.isListening ? <Button variant="destructive" size="sm" onClick={speech.stopListening}><MicOff/>Stop</Button> : <Button variant="outline" size="sm" onClick={() => speech.startListening(answer)}><Mic/>Answer with voice</Button>)}</div>{current.answer_type === "diagram" ? <DiagramCanvas key={index} ref={diagramRef}/> : <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} className={`min-h-64 ${current.answer_type === "code" ? "font-mono text-sm" : ""}`} placeholder="Give your interview answer…"/>}{evaluation ? <div className="rounded-xl border bg-primary/5 p-4 text-sm"><strong>{evaluation.score}/100.</strong> {evaluation.feedback}</div> : <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : "Submit answer"}</Button>}{(evaluation || report.length === index + 1) && <Button onClick={next} disabled={index >= questions.length - 1}>Next question</Button>}{error && <p className="text-sm text-destructive">{error}</p>}</CardContent></Card></main>;
}
