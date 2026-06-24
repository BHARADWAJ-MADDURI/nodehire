"use client";
import type { ProviderName } from "./types";

export function getSessionProviderHeaders(): Record<string, string> {
  for (const provider of ["gemini", "openai", "anthropic"] as ProviderName[]) {
    const raw = sessionStorage.getItem(`nodehire_byok_${provider}`);
    if (!raw) continue;
    try {
      const value = JSON.parse(raw) as { key: string; expiresAt: number };
      if (value.expiresAt > Date.now() && value.key) return { "x-nodehire-provider": provider, "x-nodehire-byok": value.key };
      sessionStorage.removeItem(`nodehire_byok_${provider}`);
    } catch { sessionStorage.removeItem(`nodehire_byok_${provider}`); }
  }
  return {};
}
