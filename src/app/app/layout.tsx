import { Circle, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

const futureSections: string[] = [];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const anonymous = data.user ? null : await getAnonymousSession();
  if (!data.user && !anonymous) redirect("/");

  return (
    <div className="min-h-screen bg-background/60">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{data.user ? data.user.email : "30-day demo"}</Badge>
            {data.user && <Link href="/settings" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Settings</Link>}
            <ThemeToggle />
            {data.user && <form action={signOut}><Button type="submit" size="icon" variant="ghost" aria-label="Sign out"><LogOut /></Button></form>}
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <nav className="space-y-1" aria-label="Workspace">
            <Link href="/app" className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"><Circle className="size-3 fill-current" />Prep contexts</Link>
            <Link href="/app#contexts" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"><span>Topic maps</span><span className="text-[10px] uppercase tracking-wider text-primary">Live</span></Link>
            <Link href="/app#contexts" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"><span>Drill</span><span className="text-[10px] uppercase tracking-wider text-primary">Live</span></Link>
            <Link href="/app/progress" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"><span>Progress</span><span className="text-[10px] uppercase tracking-wider text-primary">Live</span></Link>
            <Link href="/app#contexts" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"><span>Mock interview</span><span className="text-[10px] uppercase tracking-wider text-primary">Live</span></Link>
            {futureSections.map((item) => <div key={item} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground"><span>{item}</span><span className="text-[10px] uppercase tracking-wider">Soon</span></div>)}
          </nav>
          <div className="rounded-2xl border bg-card/50 p-4 text-xs leading-5 text-muted-foreground">Topic maps turn role signals into a focused, portable practice path.</div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
