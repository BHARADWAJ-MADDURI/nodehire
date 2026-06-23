import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAccount } from "./actions";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between"><Brand /><ThemeToggle /></header>
      <Link href="/app" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to workspace</Link>
      <h1 className="mt-6 text-3xl font-semibold">Settings</h1>
      <Card className="mt-8"><CardHeader><CardTitle>Account</CardTitle><CardDescription>{data.user.email}</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Your signed-in session persists securely across browser restarts.</p></CardContent></Card>
      <Card className="mt-6 border-destructive/30"><CardHeader><CardTitle>Delete account</CardTitle><CardDescription>Permanently deletes your profile and all saved prep contexts. This cannot be undone.</CardDescription></CardHeader><CardContent><form action={deleteAccount} className="space-y-4"><label className="flex items-start gap-3 text-sm"><input type="checkbox" name="confirmation" value="delete" required className="mt-1" /><span>I understand that my NodeHire data will be permanently deleted.</span></label><Button type="submit" variant="destructive">Delete my account</Button></form></CardContent></Card>
    </main>
  );
}
