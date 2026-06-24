"use client";

import { ArrowRight, BrainCircuit, Check, Code2, Network, ShieldCheck, Sparkles, Target } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";

const roles = ["Software Engineering", "Data & Analytics", "QA & Testing", "Business Analysis", "Cloud & DevOps", "Cybersecurity"];
const steps = [
  [Target, "Set your context", "Add the company, role, and job description you are targeting."],
  [Network, "Map the signals", "Turn hiring signals into a weighted, editable topic map."],
  [ShieldCheck, "Practice adaptively", "Drill weak areas and validate transfer in realistic mocks."],
] as const;

export default function Home() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function startGuestSession() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/anonymous/start", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.assign("/app");
    } catch {
      setPending(false);
      setError("Guest access is waking up. Please try again in a moment.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Brand />
        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Sign in</Link>
          <Button onClick={startGuestSession} disabled={pending}>Start free</Button>
        </nav>
      </header>
      <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:pt-24">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-sm text-muted-foreground"><Sparkles className="size-4 text-primary" />Open-source interview preparation</div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Turn any job description into a <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">focused interview plan.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">NodeHire maps the signals that matter, builds adaptive drills, and shows where your preparation creates the most leverage.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={startGuestSession} disabled={pending} className="h-12">{pending ? "Starting…" : "Start free without signing in"}<ArrowRight /></Button><Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "h-12" })}>Google or magic link</Link></div>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-7 flex flex-wrap gap-4 text-sm text-muted-foreground">{["No credit card", "Passwordless", "Private by design"].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check className="size-4 text-emerald-500" />{item}</span>)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between border-b pb-5"><div><p className="text-xs uppercase tracking-[.2em] text-primary">Prep context</p><h2 className="mt-1 text-xl font-semibold">Senior Platform Engineer</h2></div><BrainCircuit className="text-primary" /></div>
          <div className="mt-6 space-y-3">{[["Distributed systems", 92], ["System design", 84], ["Technical leadership", 71], ["Cloud reliability", 66]].map(([label, score]) => <div key={label} className="rounded-2xl border bg-background/35 p-4"><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-muted-foreground">{score}%</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400" style={{ width: `${score}%` }} /></div></div>)}</div>
        </motion.div>
      </section>
      <section className="border-y bg-card/35 py-8"><div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-3 px-5">{roles.map((role) => <span key={role} className="rounded-full border bg-background/50 px-4 py-2 text-sm text-muted-foreground">{role}</span>)}</div></section>
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <p className="text-sm uppercase tracking-[.2em] text-primary">How it works</p><h2 className="mt-3 text-4xl font-semibold">Preparation with a point of view.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">{steps.map(([Icon, title, copy], index) => <article key={title} className="glass-panel rounded-3xl p-6"><div className="mb-7 flex justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10"><Icon className="size-5 text-primary" /></span><span className="text-sm text-muted-foreground">0{index + 1}</span></div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{copy}</p></article>)}</div>
      </section>
      <footer className="border-t"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between"><p>Built by <a className="text-foreground hover:underline" href="https://www.linkedin.com/in/bharadwaj-madduri/" target="_blank" rel="noreferrer">Bharadwaj Madduri</a> · Open source.</p><div className="flex gap-4"><a className="inline-flex items-center gap-1 hover:text-foreground" href="https://github.com/BHARADWAJ-MADDURI/nodehire" target="_blank" rel="noreferrer"><Code2 className="size-4" />GitHub</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></footer>
    </main>
  );
}
