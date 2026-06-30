import { describe, expect, it } from "vitest";
import { extractJobPage } from "./job-import-parser";

describe("extractJobPage", () => {
  it("prefers Amazon's visible job sections over its generic meta description", () => {
    const html = `
      <head>
        <meta name="description" content="Explore corporate jobs and career programs at Amazon." />
        <meta property="og:site_name" content="Amazon.jobs" />
        <meta property="og:title" content="SDET II, Appstore Developer Experience" />
      </head>
      <div id="job-detail-body"><div class="content">
        <section><h2>Description</h2><p>Build automated test frameworks and test suites for mobile app developers.<br/>Build frameworks for non-functional and E2E tests.</p></section>
        <section><h2>Basic Qualifications</h2><p>- 3+ years of software development testing<br/>- Experience programming in Java, C++, or C#</p></section>
        <section><h2>Preferred Qualifications</h2><p>Knowledge of scalability, reliability, performance, and security in service-oriented architectures.</p></section>
      </div></div>
      <h2 class="job-details-title">Job details</h2>`;
    const result = extractJobPage(html, "https://www.amazon.jobs/en/jobs/10417171/example");
    expect(result.company).toBe("Amazon");
    expect(result.role).toBe("SDET II, Appstore Developer Experience");
    expect(result.jobDescription).toContain("Build automated test frameworks");
    expect(result.jobDescription).toContain("Basic Qualifications");
    expect(result.jobDescription).toContain("Preferred Qualifications");
    expect(result.jobDescription).not.toContain("Explore corporate jobs");
  });

  it("uses JobPosting structured data when available", () => {
    const posting = { "@context": "https://schema.org", "@type": "JobPosting", title: "Data Engineer", description: "<p>Design and operate reliable data pipelines, ownership controls, and observability for production workloads.</p>", hiringOrganization: { name: "Example Corp" } };
    const result = extractJobPage(`<script type="application/ld+json">${JSON.stringify(posting)}</script>`, "https://careers.example.com/job/1");
    expect(result.company).toBe("Example Corp");
    expect(result.role).toBe("Data Engineer");
    expect(result.jobDescription).toContain("reliable data pipelines");
  });

  it("infers Google from the hostname when organization metadata is absent", () => {
    const html = `<meta property="og:title" content="Program Manager, Enterprise Risk Management (Compliance)"><meta property="og:description" content="Lead enterprise risk assessments and cross-functional compliance programs."><h3>Minimum qualifications:</h3><ul><li>Experience in compliance, auditing, SQL, and risk frameworks.</li></ul><h3>Preferred qualifications:</h3><ul><li>Data analysis and Tableau.</li></ul><h3>About the job</h3><p>Improve enterprise risk accountability through a common governance framework.</p><h3>Responsibilities</h3><ul><li>Implement an enterprise Risk and Control Self-Assessment (RCSA).</li><li>Report risk trends to executive and board audiences.</li></ul><script>footer()</script>`;
    const result = extractJobPage(html, "https://www.google.com/about/careers/applications/jobs/results/117269136416875206-example");
    expect(result.company).toBe("Google");
    expect(result.jobDescription).toContain("Minimum qualifications");
    expect(result.jobDescription).toContain("RCSA");
  });
});
