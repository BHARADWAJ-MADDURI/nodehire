"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";
import { savePrepContext } from "./actions";

type Context = Database["public"]["Tables"]["prep_contexts"]["Row"];

export function PrepContextForm({ initial }: { initial?: Context | null }) {
  const [state, action, pending] = useActionState(savePrepContext, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="company">Company *</Label><Input id="company" name="company" maxLength={100} defaultValue={initial?.company ?? ""} placeholder="Visa" required /></div>
        <div className="space-y-2"><Label htmlFor="role">Target role *</Label><Input id="role" name="role" maxLength={150} defaultValue={initial?.role ?? ""} placeholder="Senior SDET" required /></div>
        <div className="space-y-2"><Label htmlFor="seniority">Seniority</Label><Input id="seniority" name="seniority" maxLength={80} defaultValue={initial?.seniority ?? ""} placeholder="Senior" /></div>
        <div className="space-y-2"><Label htmlFor="interviewDate">Interview date</Label><Input id="interviewDate" name="interviewDate" type="date" defaultValue={initial?.interview_date ?? ""} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="jobDescription">Job description *</Label><Textarea id="jobDescription" name="jobDescription" maxLength={50_000} defaultValue={initial?.job_description ?? ""} placeholder="Paste the job description here…" className="min-h-48 resize-y" required /><p className="text-xs text-muted-foreground">Up to 50,000 characters.</p></div>
      <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" maxLength={2_000} defaultValue={initial?.notes ?? ""} placeholder="Recruiter notes, interview format, or priorities…" /></div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : initial ? "Update prep context" : "Save prep context"}</Button>
    </form>
  );
}
