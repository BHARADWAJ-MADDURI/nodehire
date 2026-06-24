import { describe, expect, it } from "vitest";
import { generateQuestion } from "./generate";
import { injectRuntimeContext } from "./runtime-context";

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
});
