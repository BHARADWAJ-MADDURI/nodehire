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
  breakdown?: {
    substance: number;
    structure: number;
    validation: number;
    riskAndTradeoffs: number;
    evidence: number;
    conceptCoverage: number;
  };
  delivery?: import("./delivery").DeliveryAnalysis;
};

const stopwords = new Set(["about", "after", "again", "answer", "approach", "before", "could", "explain", "from", "have", "into", "most", "should", "that", "their", "there", "these", "they", "this", "through", "using", "what", "when", "where", "which", "with", "would", "your"]);

function conceptCoverage(answer: string, reference?: string) {
  if (!reference) return 0;
  const answerTerms = new Set(answer.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []);
  const referenceTerms = Array.from(new Set((reference.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []).filter((term) => !stopwords.has(term))));
  if (!referenceTerms.length) return 0;
  const matches = referenceTerms.filter((term) => answerTerms.has(term)).length;
  return Math.round(Math.min(30, matches / Math.min(10, referenceTerms.length) * 30));
}

export function evaluateAnswer(answer: string, topicName: string, answerType: "text" | "code" = "text", referenceAnswer?: string): EvaluationResult {
  const normalized = answer.trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const explicitlyUnknown = /\b(i\s+(?:do not|don't|dont)\s+know|i'?m\s+not\s+sure|no\s+idea|cannot\s+answer|can't\s+answer)\b/i.test(normalized);
  const isPlaceholder = words.length < 3 || /^(test(?:ing)?|sample|placeholder|n\/?a|none|skip)[.!]?$/i.test(normalized);
  const isNonAnswer = explicitlyUnknown || isPlaceholder;
  const hasStructure = /first|second|then|finally|because|trade-?off|for example|result/i.test(normalized);
  const hasValidation = /test|measure|monitor|metric|validate|verify|alert/i.test(normalized);
  const hasRisk = /risk|failure|edge case|security|rollback|fallback/i.test(normalized);
  const hasEvidence = words.length >= 30 && /for example|in my (?:last|previous)|we (?:built|implemented|designed|reduced|improved)|resulted in|\d+%/i.test(normalized);
  const breakdown = {
    substance: Math.round(Math.min(15, words.length * 0.25)),
    structure: hasStructure ? 15 : 0,
    validation: hasValidation ? 15 : 0,
    riskAndTradeoffs: hasRisk ? 15 : 0,
    evidence: hasEvidence ? 10 : 0,
    conceptCoverage: conceptCoverage(normalized, referenceAnswer),
  };
  let score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
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
    breakdown.conceptCoverage < 12 && "Address more of the model answer's core concepts",
  ].filter((value): value is string => Boolean(value));
  const needsFollowUp = score < 70;
  const complexityMatch = answer.match(/O\s*\([^)]*\)/i)?.[0];
  const codeNotice = answerType === "code" ? "Reasoning-based review; code is not run against test cases. Complexity is estimated, not verified." : undefined;
  return {
    score,
    level: score >= 80 ? "strong" : score >= 55 ? "developing" : "needs-work",
    strengths: isNonAnswer ? [] : strengths,
    gaps: isNonAnswer ? ["No interview answer was provided", "Review the model answer, then try the question again"] : gaps,
    feedback: isNonAnswer ? (explicitlyUnknown ? `You clearly said you do not know the answer. That is not evidence of ${topicName} proficiency, so this response is not scored as partially correct.` : `This looks like a placeholder rather than an interview answer, so it receives no proficiency score. Add a substantive ${topicName} response to receive baseline feedback.`) : score >= 80 ? "Strong answer. Keep the same structure and make the impact measurable." : `Build a clearer ${topicName} story by addressing: ${gaps.slice(0, 2).join("; ")}.`,
    needsFollowUp,
    followUpPrompt: needsFollowUp ? (isNonAnswer ? `After reviewing the model answer, try again: what are the first three steps you would take for this ${topicName} problem?` : `Let's go one level deeper: choose the biggest failure mode in your ${topicName} approach and explain how you would detect and recover from it.`) : null,
    estimatedComplexity: answerType === "code" ? (complexityMatch ?? "Not stated—explain your estimated Big-O.") : undefined,
    notice: codeNotice,
    betterInterviewAnswer: `A stronger answer would state assumptions, walk through the approach, cover edge cases and tradeoffs, and close with validation and measurable impact.`,
    breakdown: isNonAnswer ? { substance: 0, structure: 0, validation: 0, riskAndTradeoffs: 0, evidence: 0, conceptCoverage: 0 } : breakdown,
  };
}
