import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkspacePage() {
  return (
    <main>
      <p className="text-sm font-medium text-primary">Workspace</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Prep contexts</h1>
      <p className="mt-2 text-muted-foreground">Keep each job opportunity focused and separate.</p>
      <Card className="glass-panel mt-8 border-0">
        <CardHeader><CardTitle>Your first context is one step away</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">The prep-context editor is being connected next.</CardContent>
      </Card>
    </main>
  );
}
