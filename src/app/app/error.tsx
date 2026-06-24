"use client";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-8 text-center"><h2 className="text-xl font-semibold">This workspace view could not load</h2><p className="mt-2 text-sm text-muted-foreground">Your saved data is safe. Retry the request or return to prep contexts.</p><Button className="mt-5" onClick={reset}>Try again</Button></div>;
}
