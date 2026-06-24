"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, RefreshCw, Route, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicAnalysis } from "@/lib/topic-map/analyze";

export function TopicMapView({
  prepContextId,
  initialAnalysis,
}: {
  prepContextId: string;
  initialAnalysis: TopicAnalysis | null;
}) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedIds = useMemo(() => analysis?.branches.flatMap((branch) => branch.topics.filter((topic) => topic.selected).map((topic) => topic.id)) ?? [], [analysis]);

  async function analyze() {
    setLoading(true);
    try {
      const response = await fetch("/api/prep/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "analyze", prepContextId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed.");
      setAnalysis(result.analysis);
      toast.success("Topic map generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function toggleTopic(id: string) {
    setAnalysis((current) => current ? {
      ...current,
      branches: current.branches.map((branch) => ({
        ...branch,
        topics: branch.topics.map((topic) => topic.id === id ? { ...topic, selected: !topic.selected } : topic),
      })),
    } : current);
  }

  async function saveSelection() {
    if (!selectedIds.length) return toast.error("Select at least one topic.");
    setSaving(true);
    try {
      const response = await fetch("/api/prep/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "select", prepContextId, selectedTopicIds: selectedIds }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Selection could not be saved.");
      toast.success("Practice path saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Selection could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (!analysis) {
    return (
      <Card className="glass-panel mt-8 border-0 text-center">
        <CardContent className="flex flex-col items-center px-6 py-14">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary"><Sparkles className="size-7" /></div>
          <h2 className="mt-5 text-xl font-semibold">Turn the job description into a practice map</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">NodeHire extracts role signals, maps them to portable skills, and recommends the strongest starting path.</p>
          <Button onClick={analyze} disabled={loading} className="mt-6">{loading ? <><RefreshCw className="animate-spin" />Analyzing…</> : <><Sparkles />Generate topic map</>}</Button>
        </CardContent>
      </Card>
    );
  }

  const topics = analysis.branches.flatMap((branch) => branch.topics);
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/65"><CardHeader><CardDescription>Role family</CardDescription><CardTitle className="capitalize">{analysis.roleFamily}</CardTitle></CardHeader></Card>
        <Card className="bg-card/65"><CardHeader><CardDescription>Seniority signal</CardDescription><CardTitle>{analysis.seniority}</CardTitle></CardHeader></Card>
        <Card className="bg-card/65"><CardHeader><CardDescription>Selected topics</CardDescription><CardTitle>{selectedIds.length} of {topics.length}</CardTitle></CardHeader></Card>
      </div>

      {analysis.signals.length > 0 && <div className="flex flex-wrap gap-2">{analysis.signals.map((signal) => <Badge key={signal} variant="secondary">{signal}</Badge>)}</div>}

      <Card className="glass-panel border-0">
        <CardHeader><CardTitle className="flex items-center gap-2"><Route className="size-5 text-primary" />Recommended starting path</CardTitle><CardDescription>Begin with the highest-weight evidence from this role.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{analysis.recommendedPath.map((id, index) => {
          const topic = topicById.get(id);
          return topic ? <div key={id} className="rounded-xl border bg-background/45 p-4"><span className="text-xs font-semibold text-primary">STEP {index + 1}</span><p className="mt-2 text-sm font-medium">{topic.name}</p></div> : null;
        })}</CardContent>
      </Card>

      <AnimatePresence>{analysis.branches.map((branch, branchIndex) => (
        <motion.section key={branch.domain} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: branchIndex * 0.06 }}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{branch.domain}</h2><Badge variant="outline">{Math.round(branch.weight * 100)}% weight</Badge></div>
          <div className="grid gap-3 xl:grid-cols-2">{branch.topics.map((topic) => (
            <button key={topic.id} type="button" onClick={() => toggleTopic(topic.id)} aria-pressed={topic.selected} className={`group rounded-2xl border p-5 text-left transition ${topic.selected ? "border-primary/40 bg-primary/8" : "bg-card/35 opacity-60 hover:opacity-90"}`}>
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-medium">{topic.name}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{topic.description}</p></div><span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${topic.selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>{topic.selected && <Check className="size-4" />}</span></div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, topic.weight * 100)}%` }} /></div>
              <p className="mt-3 text-xs text-muted-foreground">{Math.round(topic.weight * 100)}% · {topic.rationale}</p>
            </button>
          ))}</div>
        </motion.section>
      ))}</AnimatePresence>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/90 p-4 shadow-xl backdrop-blur-xl"><p className="text-sm text-muted-foreground">Choose the skills you want in your practice path.</p><div className="flex gap-2"><Button variant="outline" onClick={analyze} disabled={loading}>{loading ? <RefreshCw className="animate-spin" /> : <RefreshCw />}Refresh map</Button><Button onClick={saveSelection} disabled={saving}>{saving ? "Saving…" : "Save selection"}</Button></div></div>
    </div>
  );
}
