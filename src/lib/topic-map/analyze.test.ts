import { describe, expect, it } from "vitest";
import { analyzePrepContext } from "./analyze";

describe("analyzePrepContext", () => {
  it("creates the expected weighted map for Visa Senior SDET", () => {
    const result = analyzePrepContext({
      company: "Visa",
      role: "Senior SDET",
      seniority: "Senior",
      jobDescription: "Build API automation frameworks, CI/CD quality gates, payment testing, security testing, and mentor engineers.",
    });
    const ids = result.branches.flatMap((branch) => branch.topics.map((topic) => topic.id));
    expect(result.roleFamily).toBe("quality");
    expect(ids).toEqual(expect.arrayContaining([
      "api-testing",
      "automation-architecture",
      "ci-cd-testing",
      "payments-testing",
      "security-testing",
      "behavioral-leadership",
    ]));
    expect(result.recommendedPath).toHaveLength(4);
  });

  it("maps data engineering signals to portable data skills", () => {
    const result = analyzePrepContext({
      company: "Example",
      role: "Data Engineer",
      jobDescription: "Build Airflow ETL pipelines with Spark, Snowflake, SQL, and data quality checks.",
    });
    const ids = result.branches.flatMap((branch) => branch.topics.map((topic) => topic.id));
    expect(ids).toEqual(expect.arrayContaining(["data-pipelines", "sql", "distributed-data", "warehousing", "data-quality"]));
  });

  it("maps broad frontend signals to drillable React and JavaScript sub-leaves", () => {
    const result = analyzePrepContext({
      company: "Example",
      role: "Senior Frontend Engineer",
      jobDescription: "Build React hooks and state management, diagnose render performance, and explain the JavaScript event loop and TypeScript generics.",
    });
    const ids = result.branches.flatMap((branch) => branch.topics.map((topic) => topic.id));
    expect(ids).toEqual(expect.arrayContaining(["react-hooks", "react-state-management", "react-rendering-performance", "js-async-event-loop", "ts-type-system"]));
    expect(ids).not.toContain("react");
  });
});
