import { describe, expect, it } from "vitest";
import { evaluateAnswer } from "./evaluate-answer";

describe("evaluateAnswer", () => {
  it("does not invent strengths when the candidate says they do not know", () => {
    const result = evaluateAnswer("I would like to answer in five points, but I don't know the answer.", "API Design");
    expect(result.score).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.feedback).toContain("do not know");
  });
  it("scores placeholders as zero even when they contain rubric keywords", () => {
    const result = evaluateAnswer("TEST", "API Design");
    expect(result.score).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.feedback).toContain("placeholder");
  });
  it("creates a follow-up for a weak answer", () => {
    const result = evaluateAnswer("I would test it.", "API Testing");
    expect(result.needsFollowUp).toBe(true);
    expect(result.followUpPrompt).toContain("failure mode");
  });

  it("recognizes a structured, evidence-backed answer", () => {
    const answer = "First, I define the risks and assumptions. For example, in my last project we measured error rates and latency, then added contract tests and monitoring alerts. We considered security edge cases, rollback, and failure recovery. Finally, I validated the result with production metrics and the team reduced incidents. ".repeat(3);
    const result = evaluateAnswer(answer, "API Testing", "text", "Define risks and assumptions, add contract tests, monitor latency and error rates, cover security edge cases and rollback, then validate with production metrics.");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.needsFollowUp).toBe(false);
  });

  it("limits polished but semantically unrelated answers", () => {
    const result = evaluateAnswer("First, I would communicate clearly, measure the result, monitor metrics, and consider risk and rollback. For example, my previous team improved an unrelated hiring workflow by 40%.", "API Design", "text", "Use idempotency keys, atomic ledger transactions, stable error codes, authentication, authorization, versioned contracts, tracing, and reconciliation.");
    expect(result.breakdown?.conceptCoverage).toBeLessThan(12);
    expect(result.score).toBeLessThan(80);
  });
});
