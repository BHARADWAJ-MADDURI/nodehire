import "server-only";
import { decryptProviderKey } from "./encryption";
import type { ProviderName } from "./types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function resolveProviderCredential(request: Request, userId: string | null) {
  const headerProvider = request.headers.get("x-nodehire-provider") as ProviderName | null;
  const headerKey = request.headers.get("x-nodehire-byok");
  if (headerProvider && headerKey && ["gemini", "openai", "anthropic"].includes(headerProvider)) return { provider: headerProvider, apiKey: headerKey, source: "byok" as const };
  if (userId) {
    const query = createSupabaseAdminClient().from("user_provider_keys").select("provider, encrypted_key").eq("user_id", userId);
    const { data } = headerProvider ? await query.eq("provider", headerProvider).maybeSingle() : await query.limit(1).maybeSingle();
    if (data) return { provider: data.provider as ProviderName, apiKey: decryptProviderKey(data.encrypted_key, userId, data.provider as ProviderName), source: "byok" as const };
    return null;
  }
  if (process.env.GEMINI_API_KEY) return { provider: "gemini" as const, apiKey: process.env.GEMINI_API_KEY, source: "app" as const };
  return null;
}
