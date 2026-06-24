export type ProviderName = "gemini" | "openai" | "anthropic";
export type ProviderErrorCode = "INVALID_KEY" | "RATE_LIMITED" | "PROVIDER_UNAVAILABLE";
export class ProviderError extends Error {
  constructor(public code: ProviderErrorCode, message: string, public status = 502) { super(message); }
}
