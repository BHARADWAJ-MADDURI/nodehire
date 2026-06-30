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
  const isNonAnswer = /\b(i\s+(?:do not|don't|dont)\s+know|i'?m\s+not\s+sure|no\s+idea|cannot\s+answer|can't\s+answer)\b/i.test(normalized);
  const hasStructure = /first|second|then|finally|because|trade-?off|for example|result/i.test(normalized);
  const hasValidation = /test|measure|monitor|metric|validate|verify|alert/i.test(normalized);
  const hasRisk = /risk|failure|edge case|security|rollback|fallback/i.test(normalized);
  const hasEvidence = words.length >= 30 && /for example|in my (?:last|previous)|we (?:built|implemented|designed|reduced|improved)|resulted in|\d+%/i.test(normalized);
  let score = Math.min(45, words.length * 0.75);
  if (hasStructure) score += 15;
  if (hasValidation) score += 15;
  if (hasRisk) score += 15;
  if (hasEvidence) score += 10;
  score = Math.round(Math.min(100, score));
  if (isNonAnswer) score = 0;
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
  const codeNotice = answerType === "code" ? "Reasoning-based review; code is not run against test cases. Complexity is estimated, not verified." : undefined;
  return {
    score,
    level: score >= 80 ? "strong" : score >= 55 ? "developing" : "needs-work",
    strengths: isNonAnswer ? [] : strengths,
    gaps: isNonAnswer ? ["No interview answer was provided", "Review the model answer, then try the question again"] : gaps,
    feedback: isNonAnswer ? `You clearly said you do not know the answer. That is not evidence of ${topicName} proficiency, so this response is not scored as partially correct.` : score >= 80 ? "Strong answer. Keep the same structure and make the impact measurable." : `Build a clearer ${topicName} story by addressing: ${gaps.slice(0, 2).join("; ")}.`,
    needsFollowUp,
    followUpPrompt: needsFollowUp ? (isNonAnswer ? `After reviewing the model answer, try again: what are the first three steps you would take for this ${topicName} problem?` : `Let's go one level deeper: choose the biggest failure mode in your ${topicName} approach and explain how you would detect and recover from it.`) : null,
    estimatedComplexity: answerType === "code" ? (complexityMatch ?? "Not stated—explain your estimated Big-O.") : undefined,
    notice: codeNotice,
    betterInterviewAnswer: `A stronger answer would state assumptions, walk through the approach, cover edge cases and tradeoffs, and close with validation and measurable impact.`,
  };
}
