import { LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { WorkspaceNav } from "@/components/workspace-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const anonymous = data.user ? null : await getAnonymousSession();
  if (!data.user && !anonymous) redirect("/");
  const admin = createSupabaseAdminClient();
  let contextQuery = admin.from("prep_contexts").select("id").order("created_at", { ascending: false }).limit(1);
  contextQuery = data.user ? contextQuery.eq("user_id", data.user.id) : contextQuery.eq("anonymous_session_id", anonymous!.id);
  const { data: recentContexts } = await contextQuery;
  const contextId = recentContexts?.[0]?.id;

  return (
    <div className="min-h-screen bg-background/60">
      <a href="#main-content" className="fixed left-4 top-2 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition focus:translate-y-0">Skip to main content</a>
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{data.user ? data.user.email : "Free guest"}</Badge>
            {data.user && <Link href="/settings" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Settings</Link>}
            <ThemeToggle />
            {data.user && <form action={signOut}><Button type="submit" size="icon" variant="ghost" aria-label="Sign out"><LogOut /></Button></form>}
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-8 lg:py-8">
        <aside className="space-y-6">
          <WorkspaceNav contextId={contextId} />
          <div className="hidden rounded-2xl border bg-card/50 p-4 text-xs leading-5 text-muted-foreground lg:block">Your selected topics stay active as you move between drills, progress, and mock interviews.</div>
        </aside>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
  );
}
