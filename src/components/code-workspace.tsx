"use client";

import { Braces, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CodeWorkspace({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/20">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-slate-300">
        <span className="flex items-center gap-2 text-xs font-medium"><Braces className="size-4 text-sky-400" />Coding whiteboard</span>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => onChange("")}><RotateCcw />Clear</Button>
      </div>
      <div className="grid grid-cols-[3rem_1fr] bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[length:100%_1.75rem]">
        <div aria-hidden="true" className="select-none border-r border-slate-800 py-4 pr-3 text-right font-mono text-sm leading-7 text-slate-600">{Array.from({ length: 14 }, (_, index) => <div key={index}>{index + 1}</div>)}</div>
        <Textarea value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} placeholder={"// Write your solution here\n// Explain complexity and edge cases below the code"} className="min-h-96 resize-y rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-7 text-slate-100 placeholder:text-slate-600 focus-visible:ring-0" />
      </div>
      <p className="border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">Interview whiteboard mode — reasoning-based review; code is not executed against test cases.</p>
    </div>
  );
}
