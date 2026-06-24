export type EvaluationResult = {
  score: number;
  level: "needs-work" | "developing" | "strong";
  strengths: string[];
  gaps: string[];
  feedback: string;
  needsFollowUp: boolean;
  followUpPrompt: string | null;
  estimatedComplexity?: string;
  notice?: string;
  betterInterviewAnswer?: string;
};

export function evaluateAnswer(answer: string, topicName: string, answerType: "text" | "code" = "text"): EvaluationResult {
  const normalized = answer.trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const hasStructure = /first|second|then|finally|because|trade-?off|for example|result/i.test(normalized);
  const hasValidation = /test|measure|monitor|metric|validate|verify|alert/i.test(normalized);
  const hasRisk = /risk|failure|edge case|security|rollback|fallback/i.test(normalized);
  const hasEvidence = /I |we |my |our |example|situation|result/i.test(normalized);
  let score = Math.min(45, words.length * 0.75);
  if (hasStructure) score += 15;
  if (hasValidation) score += 15;
  if (hasRisk) score += 15;
  if (hasEvidence) score += 10;
  score = Math.round(Math.min(100, score));
  const strengths = [
    hasStructure && "Structured reasoning",
    hasValidation && "Clear validation approach",
    hasRisk && "Risk awareness",
    hasEvidence && "Concrete evidence",
  ].filter((value): value is string => Boolean(value));
  const gaps = [
    words.length < 60 && "Add more technical depth",
    !hasValidation && "Explain how you would validate the outcome",
    !hasRisk && "Cover failure modes and tradeoffs",
    !hasEvidence && "Include a concrete example",
  ].filter((value): value is string => Boolean(value));
  const needsFollowUp = score < 70;
  const complexityMatch = answer.match(/O\s*\([^)]*\)/i)?.[0];
  const codeNotice = answerType === "code" ? "AI-assessed, not run against test cases. Complexity is estimated, not verified." : undefined;
  return {
    score,
    level: score >= 80 ? "strong" : score >= 55 ? "developing" : "needs-work",
    strengths,
    gaps,
    feedback: score >= 80 ? "Strong answer. Keep the same structure and make the impact measurable." : `Build a clearer ${topicName} story by addressing: ${gaps.slice(0, 2).join("; ")}.`,
    needsFollowUp,
    followUpPrompt: needsFollowUp ? `Let's go one level deeper: choose the biggest failure mode in your ${topicName} approach and explain how you would detect and recover from it.` : null,
    estimatedComplexity: answerType === "code" ? (complexityMatch ?? "Not stated—explain your estimated Big-O.") : undefined,
    notice: codeNotice,
    betterInterviewAnswer: `A stronger answer would state assumptions, walk through the approach, cover edge cases and tradeoffs, and close with validation and measurable impact.`,
  };
}
