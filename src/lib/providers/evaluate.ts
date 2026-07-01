import "server-only";
import { z } from "zod";
import { callProvider } from "./call";
import type { ProviderName } from "./types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const resultSchema = z.object({
  readable: z.boolean().default(true),
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(5),
  gaps: z.array(z.string()).max(5),
  feedback: z.string(),
  betterInterviewAnswer: z.string(),
  estimatedComplexity: z.string().optional(),
});

export async function evaluateWithProvider(input: { provider: ProviderName; apiKey: string; source: "app" | "byok"; question: string; answer?: string; imageDataUrl?: string; rubric: unknown; answerType: string; candidateContext?: string | null }) {
  const units = input.imageDataUrl ? 3 : 1;
  const admin = createSupabaseAdminClient();
  if (input.source === "app") {
    const ceiling = Number(process.env.GEMINI_DAILY_CEILING || 200);
    const { data: allowed } = await admin.rpc("reserve_app_usage", { p_units: units, p_ceiling: ceiling });
    if (!allowed) return { ceilingReached: true as const };
  }
  try {
    const prompt = `Evaluate this interview answer. Return JSON only with readable, score (0-100), strengths, gaps, feedback, betterInterviewAnswer, and optional estimatedComplexity. Never invent strengths or candidate experience. If the candidate says they do not know, score 0. If an image is illegible, set readable false and score 0 without penalizing language. Question: ${input.question}\nAnswer type: ${input.answerType}\nRubric: ${JSON.stringify(input.rubric)}\nCandidate background (use only to check truthful grounding): ${input.candidateContext?.slice(0, 12000) || "Not provided"}\nAnswer: ${input.answer ?? "See submitted diagram."}`;
    const raw = await callProvider({ provider: input.provider, apiKey: input.apiKey, prompt, imageDataUrl: input.imageDataUrl });
    const json = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
    const result = resultSchema.parse(json);
    if (input.source === "app") await admin.rpc("finish_app_usage", { p_units: units, p_success: true });
    return { ceilingReached: false as const, result };
  } catch (error) {
    if (input.source === "app") await admin.rpc("finish_app_usage", { p_units: units, p_success: false });
    throw error;
  }
}
