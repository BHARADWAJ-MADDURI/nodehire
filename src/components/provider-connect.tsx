"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, KeyRound, Loader2, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProviderName } from "@/lib/providers/types";

const providers: Array<{ id: ProviderName; name: string; url: string; costNote: string }> = [
  { id: "gemini", name: "Gemini", url: "https://aistudio.google.com/apikey", costNote: "Gemini may include free-tier usage. Your Google project's plan and limits apply." },
  { id: "openai", name: "OpenAI", url: "https://platform.openai.com/api-keys", costNote: "OpenAI API usage is billed separately from ChatGPT subscriptions." },
  { id: "anthropic", name: "Anthropic", url: "https://console.anthropic.com/settings/keys", costNote: "Anthropic API usage may require prepaid usage credits." },
];

export function ProviderConnect({ authenticated, initialConnected = [], compact = false }: { authenticated: boolean; initialConnected?: string[]; compact?: boolean }) {
  const [provider, setProvider] = useState<ProviderName>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [connected, setConnected] = useState(initialConnected);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "success" | "error"; message?: string }>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusOnReturn = () => { if (document.visibilityState === "visible") inputRef.current?.focus(); };
    document.addEventListener("visibilitychange", focusOnReturn);
    return () => document.removeEventListener("visibilitychange", focusOnReturn);
  }, []);
  function openProvider() {
    const selected = providers.find((item) => item.id === provider)!;
    window.open(selected.url, "_blank", "noopener,noreferrer");
  }
  const selectedProvider = providers.find((item) => item.id === provider)!;
  async function connect() {
    setStatus({ kind: "loading" });
    const response = await fetch("/api/providers/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey, remember: authenticated && remember }) });
    const result = await response.json();
    if (response.ok) {
      if (!result.persisted) sessionStorage.setItem(`nodehire_byok_${provider}`, JSON.stringify({ key: apiKey, expiresAt: Date.now() + 86_400_000 }));
      setConnected((items) => Array.from(new Set([...items, provider]))); setApiKey(""); setStatus({ kind: "success", message: "Connected" });
    } else setStatus({ kind: "error", message: result.code === "INVALID_KEY" ? "Invalid key" : result.code === "RATE_LIMITED" ? "Rate limited" : "Provider unavailable" });
  }
  async function disconnect(value: ProviderName) {
    sessionStorage.removeItem(`nodehire_byok_${value}`);
    if (authenticated) await fetch(`/api/providers/connect?provider=${value}`, { method: "DELETE" });
    setConnected((items) => items.filter((item) => item !== value));
  }
  return <div className="space-y-5"><div className="grid grid-cols-3 gap-2">{providers.map((item) => <Button key={item.id} type="button" variant={provider === item.id ? "default" : "outline"} onClick={() => setProvider(item.id)}>{item.name}</Button>)}</div><p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">{selectedProvider.costNote}</p><Button type="button" variant="outline" onClick={openProvider}><ExternalLink/>Open {selectedProvider.name} API keys</Button><div className="grid gap-2 sm:grid-cols-3">{["1. Create key", "2. Copy it", "3. Paste below"].map((step) => <div key={step} className="rounded-xl border bg-muted/40 p-3 text-center text-xs font-medium">{step}</div>)}</div><div className="space-y-2"><Label htmlFor="provider-key">API key</Label><Input ref={inputRef} id="provider-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" placeholder="Paste your key" /></div>{authenticated && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember this key for next time</label>}<p className="text-xs text-muted-foreground">{authenticated && remember ? "This key is encrypted and saved to your account so you won't need to paste it again. You can disconnect it anytime in Settings." : "Never stored—sent securely only to proxy this request, then discarded."}</p><div className="flex items-center gap-3"><Button type="button" onClick={connect} disabled={apiKey.length < 10 || status.kind === "loading"}>{status.kind === "loading" ? <Loader2 className="animate-spin"/> : <KeyRound/>}Validate & connect</Button>{status.kind === "success" && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="size-4"/>Connected</span>}{status.kind === "error" && <span className="flex items-center gap-1 text-sm text-destructive"><XCircle className="size-4"/>{status.message}</span>}</div>{!compact && connected.length > 0 && <div className="space-y-2 border-t pt-4">{connected.map((value) => <div key={value} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span className="capitalize">{value} connected</span><Button type="button" size="sm" variant="ghost" onClick={() => disconnect(value as ProviderName)}><Trash2/>Disconnect</Button></div>)}</div>}</div>;
}
