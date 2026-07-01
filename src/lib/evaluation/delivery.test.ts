import { describe, expect, it } from "vitest";
import { analyzeDelivery } from "./delivery";

describe("analyzeDelivery", () => {
  it("reports pace, fillers, and STAR completeness", () => {
    const answer = "Um, when my team faced repeated failures, my goal was to reduce incidents. I implemented contract tests and monitoring. The result reduced incidents by 40%.";
    const result = analyzeDelivery(answer, 30);
    expect(result.estimatedWordsPerMinute).toBeGreaterThan(40);
    expect(result.fillerWordCount).toBe(1);
    expect(result.star).toEqual({ situation: true, task: true, action: true, result: true });
  });
});
