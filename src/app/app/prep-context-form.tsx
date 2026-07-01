"use client";

import { useActionState, useRef, useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";
import { savePrepContext } from "./actions";

type Context = Database["public"]["Tables"]["prep_contexts"]["Row"];

export function PrepContextForm({ initial }: { initial?: Context | null }) {
  const [state, action, pending] = useActionState(savePrepContext, {});
  const [jobUrl, setJobUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  async function importJob() {
    setImporting(true); setImportError("");
    const response = await fetch("/api/jobs/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: jobUrl }) });
    const result = await response.json();
    if (response.ok) {
      if (result.job.company && companyRef.current) companyRef.current.value = result.job.company;
      if (result.job.role && roleRef.current) roleRef.current.value = result.job.role;
      if (descriptionRef.current) descriptionRef.current.value = result.job.jobDescription;
    } else setImportError(result.error || "The job could not be imported.");
    setImporting(false);
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <div className="rounded-2xl border bg-muted/25 p-4"><Label htmlFor="jobUrl">Import from a public job link</Label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Input id="jobUrl" type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://company.com/careers/job…" /><Button type="button" variant="outline" onClick={importJob} disabled={importing || !jobUrl}>{importing ? <Loader2 className="animate-spin" /> : <Link2 />}Import</Button></div><p className="mt-2 text-xs text-muted-foreground">Works best with public company career pages. If LinkedIn or Indeed blocks access, paste the description below.</p>{importError && <p role="alert" className="mt-2 text-sm text-destructive">{importError}</p>}</div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="company">Company *</Label><Input ref={companyRef} id="company" name="company" maxLength={100} defaultValue={initial?.company ?? ""} placeholder="Company name" required /></div>
        <div className="space-y-2"><Label htmlFor="role">Target role *</Label><Input ref={roleRef} id="role" name="role" maxLength={150} defaultValue={initial?.role ?? ""} placeholder="Role title" required /></div>
        <div className="space-y-2"><Label htmlFor="seniority">Seniority</Label><Input id="seniority" name="seniority" maxLength={80} defaultValue={initial?.seniority ?? ""} placeholder="Optional level" /></div>
        <div className="space-y-2"><Label htmlFor="interviewDate">Interview date</Label><Input id="interviewDate" name="interviewDate" type="date" defaultValue={initial?.interview_date ?? ""} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="jobDescription">Job description *</Label><Textarea ref={descriptionRef} id="jobDescription" name="jobDescription" maxLength={50_000} defaultValue={initial?.job_description ?? ""} placeholder="Paste the job description here…" className="min-h-48 resize-y" required /><p className="text-xs text-muted-foreground">Up to 50,000 characters. Always review imported text before saving.</p></div>
      <div className="space-y-2"><Label htmlFor="resumeText">Resume or experience context <span className="text-muted-foreground">(recommended)</span></Label><Textarea id="resumeText" name="resumeText" maxLength={20_000} defaultValue={initial?.resume_text ?? ""} placeholder="Paste your resume, major projects, achievements, and technologies. NodeHire uses this to ground behavioral questions and coaching in your real experience." className="min-h-40 resize-y" /><p className="text-xs text-muted-foreground">Stored with this private prep context. Never added to the shared question-cache key.</p></div>
      <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" maxLength={2_000} defaultValue={initial?.notes ?? ""} placeholder="Recruiter notes, interview format, or priorities…" /></div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : initial ? "Update prep context" : "Save prep context"}</Button>
    </form>
  );
}
