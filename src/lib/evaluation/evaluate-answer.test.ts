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
    const result = evaluateAnswer(answer, "API Testing");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.needsFollowUp).toBe(false);
  });
});
