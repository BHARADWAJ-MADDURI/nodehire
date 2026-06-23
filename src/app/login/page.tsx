"use client";

import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithGoogle } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, {});

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-16">
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 sm:px-8">
        <Brand />
        <ThemeToggle />
      </header>

      <div className="w-full max-w-md">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <Card className="glass-panel border-0">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Welcome to NodeHire</CardTitle>
            <CardDescription>Sign in without a password and keep your prep contexts across devices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={signInWithGoogle}>
              <Button type="submit" variant="outline" className="h-11 w-full">
                <span className="mr-2 font-bold text-primary">G</span>
                Continue with Google
              </Button>
            </form>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              </div>
              {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
              {state.success && <p role="status" className="text-sm text-emerald-500">{state.success}</p>}
              <Button type="submit" className="h-11 w-full" disabled={pending}>
                <Mail className="size-4" />
                {pending ? "Sending…" : "Email me a magic link"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          By continuing, you agree to the <Link className="underline hover:text-foreground" href="/terms">Terms</Link> and <Link className="underline hover:text-foreground" href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
