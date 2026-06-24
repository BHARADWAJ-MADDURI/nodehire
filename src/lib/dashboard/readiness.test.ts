import { describe, expect, it } from "vitest";
import { computeReadiness } from "./readiness";

describe("computeReadiness", () => {
  it("computes context readiness without persisting it", () => {
    const result = computeReadiness(
      [{ ontology_leaf_id: "api-testing", weight: 0.7 }, { ontology_leaf_id: "behavioral-leadership", weight: 0.3 }],
      new Map([["api-testing", 80], ["behavioral-leadership", 60]]),
    );
    expect(result.role).toBe(74);
    expect(result.company).toBeLessThan(result.role);
  });
});
