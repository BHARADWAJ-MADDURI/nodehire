import "server-only";
import { ProviderError, type ProviderName } from "./types";

function classify(status: number) {
  if (status === 401 || status === 403 || status === 400) return new ProviderError("INVALID_KEY", "The provider rejected this API key.", 401);
  if (status === 429) return new ProviderError("RATE_LIMITED", "This provider key is currently rate limited.", 429);
  return new ProviderError("PROVIDER_UNAVAILABLE", "The provider is temporarily unavailable.", 503);
}
export async function validateProviderKey(provider: ProviderName, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const config: { url: string; headers: Record<string, string> } = provider === "gemini"
      ? { url: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", headers: { "x-goog-api-key": apiKey } }
      : provider === "openai"
        ? { url: "https://api.openai.com/v1/models", headers: { Authorization: `Bearer ${apiKey}` } }
        : { url: "https://api.anthropic.com/v1/models?limit=1", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } };
    const response = await fetch(config.url, { headers: config.headers, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw classify(response.status);
    return true;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("PROVIDER_UNAVAILABLE", "The provider could not be reached.", 503);
  } finally { clearTimeout(timeout); }
}
