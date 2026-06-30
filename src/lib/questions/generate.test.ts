import { describe, expect, it } from "vitest";
import { generateQuestion } from "./generate";
import { injectRuntimeContext } from "./runtime-context";
import { ONTOLOGY } from "@/lib/topic-map/ontology";

describe("question generation", () => {
  it("generates a portable question without company or JD in the cache content", () => {
    const question = generateQuestion({ ontologyLeafId: "api-testing", mode: "drill", difficulty: "medium" });
    expect(question.questionText).toContain("API");
    expect(question.questionText).not.toContain("Visa");
  });

  it("injects company and role only at runtime", () => {
    const context = injectRuntimeContext({ company: "Visa", role: "Senior SDET", ontologyName: "API Testing" });
    expect(context.framing).toContain("Visa");
    expect(context.framing).toContain("Senior SDET");
  });

  it("uses a concrete scenario for every ontology leaf", () => {
    for (const leaf of ONTOLOGY) {
      const question = generateQuestion({ ontologyLeafId: leaf.id, mode: "drill", difficulty: "medium" });
      expect(question.questionText).not.toMatch(/approach a realistic .+ problem/i);
      expect(question.questionText).not.toMatch(/for this focused drill/i);
      expect(question.questionText.length).toBeGreaterThan(120);
    }
  });

  it("asks a specific UI automation question instead of a generic topic prompt", () => {
    const question = generateQuestion({ ontologyLeafId: "ui-automation", mode: "drill", difficulty: "medium" });
    expect(question.questionText).toContain("600 browser tests");
    expect(question.questionText).toContain("15% flaky-failure rate");
  });

  it("targets expanded ontology sub-leaves directly", () => {
    const question = generateQuestion({ ontologyLeafId: "react-rendering-performance", mode: "drill", difficulty: "hard" });
    expect(question.questionText).toContain("5,000-row React table");
    expect(question.questionText).toContain("concurrency");
  });

  it("creates distinct realistic mock variants without a fake five-minute limit", () => {
    const first = generateQuestion({ ontologyLeafId: "rcsa-controls", mode: "mock", difficulty: "medium", variantIndex: 0 });
    const second = generateQuestion({ ontologyLeafId: "rcsa-controls", mode: "mock", difficulty: "medium", variantIndex: 1 });
    expect(first.questionText).not.toBe(second.questionText);
    expect(first.questionText).not.toContain("You have five minutes");
    expect(second.questionText).toContain("senior stakeholder");
  });
});
