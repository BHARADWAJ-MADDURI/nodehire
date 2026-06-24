import "server-only";
import { ProviderError, type ProviderName } from "./types";

function errorFor(status: number) {
  if ([400, 401, 403].includes(status)) return new ProviderError("INVALID_KEY", "The provider rejected this API key.", 401);
  if (status === 429) return new ProviderError("RATE_LIMITED", "The provider quota is currently exhausted.", 429);
  return new ProviderError("PROVIDER_UNAVAILABLE", "The provider is temporarily unavailable.", 503);
}
export async function callProvider(input: { provider: ProviderName; apiKey: string; prompt: string; imageDataUrl?: string }) {
  const image = input.imageDataUrl?.split(",")[1];
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    let response: Response;
    if (input.provider === "gemini") {
      const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];
      if (image) parts.push({ inlineData: { mimeType: "image/png", data: image } });
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": input.apiKey }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }), signal: controller.signal });
      if (!response.ok) throw errorFor(response.status);
      const data = await response.json(); return data.candidates?.[0]?.content?.parts?.[0]?.text as string;
    }
    if (input.provider === "openai") {
      const content: Array<Record<string, unknown>> = [{ type: "input_text", text: input.prompt }];
      if (input.imageDataUrl) content.push({ type: "input_image", image_url: input.imageDataUrl });
      response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.apiKey}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", input: [{ role: "user", content }], text: { format: { type: "json_object" } } }), signal: controller.signal });
      if (!response.ok) throw errorFor(response.status);
      const data = await response.json(); return data.output_text as string;
    }
    const content: Array<Record<string, unknown>> = [{ type: "text", text: input.prompt }];
    if (image) content.push({ type: "image", source: { type: "base64", media_type: "image/png", data: image } });
    response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": input.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest", max_tokens: 1200, messages: [{ role: "user", content }] }), signal: controller.signal });
    if (!response.ok) throw errorFor(response.status);
    const data = await response.json(); return data.content?.find((item: { type: string }) => item.type === "text")?.text as string;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("PROVIDER_UNAVAILABLE", "The provider call timed out or failed.", 503);
  } finally { clearTimeout(timeout); }
}
