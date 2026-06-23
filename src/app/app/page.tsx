import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { deletePrepContext } from "./actions";
import { PrepContextForm } from "./prep-context-form";

type Context = Database["public"]["Tables"]["prep_contexts"]["Row"];

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  let contexts: Context[] = [];

  if (auth.user) {
    const { data } = await supabase.from("prep_contexts").select("*").order("updated_at", { ascending: false });
    contexts = data ?? [];
  } else {
    const anonymous = await getAnonymousSession();
    if (anonymous) {
      const { data } = await createSupabaseAdminClient().from("prep_contexts").select("*").eq("anonymous_session_id", anonymous.id).order("updated_at", { ascending: false });
      contexts = data ?? [];
    }
  }

  const editing = contexts.find((context) => context.id === params.edit) ?? null;

  return (
    <main>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-primary">Workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Prep contexts</h1><p className="mt-2 text-muted-foreground">Keep each job opportunity focused and separate.</p></div>
        {contexts.length > 0 && <Badge variant="secondary">{contexts.length} saved</Badge>}
      </div>
      {params.saved && <p role="status" className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">Prep context saved. Topic analysis arrives in Phase 2.</p>}

      <Card className="glass-panel mt-8 border-0">
        <CardHeader><CardTitle>{editing ? "Edit prep context" : "Add a prep context"}</CardTitle><CardDescription>Company, role, and job description are required.</CardDescription></CardHeader>
        <CardContent><PrepContextForm key={editing?.id ?? "new"} initial={editing} />{editing && <Link href="/app" className={buttonVariants({ variant: "ghost", className: "mt-3" })}>Cancel editing</Link>}</CardContent>
      </Card>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Saved contexts</h2>
        {contexts.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Your saved interview targets will appear here.</div> : <div className="mt-4 grid gap-4 xl:grid-cols-2">{contexts.map((context) => (
          <Card key={context.id} className="bg-card/65">
            <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>{context.role}</CardTitle><CardDescription className="mt-1">{context.company}</CardDescription></div>{context.seniority && <Badge variant="outline">{context.seniority}</Badge>}</div></CardHeader>
            <CardContent><p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{context.job_description}</p><div className="mt-5 flex gap-2"><Link href={`/app?edit=${context.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link><form action={deletePrepContext}><input type="hidden" name="id" value={context.id} /><Button type="submit" size="sm" variant="ghost" className="text-destructive">Delete</Button></form></div></CardContent>
          </Card>
        ))}</div>}
      </section>
    </main>
  );
}
