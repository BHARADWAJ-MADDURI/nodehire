import { ONTOLOGY } from "@/lib/topic-map/ontology";
import type { GeneratedQuestion, QuestionDifficulty, QuestionMode } from "./types";

const prompts: Record<string, string> = {
  "api-testing": "How would you design a test strategy for an API that creates and updates financial transactions?",
  "automation-architecture": "How would you structure a maintainable automation framework used by several engineering teams?",
  "ci-cd-testing": "How would you design quality gates that are fast enough for CI while still protecting a production release?",
  "payments-testing": "What failure modes would you test in an idempotent payment authorization and reconciliation flow?",
  "security-testing": "How would you test authorization boundaries and abuse cases for a sensitive service?",
  "behavioral-leadership": "Tell me about a time you raised engineering quality without having direct authority over the team.",
  "system-design": "Design a reliable service for a workload that must scale while preserving data consistency.",
  "data-pipelines": "How would you design and operate a reliable pipeline when upstream data can arrive late or malformed?",
  "sql": "How would you diagnose and improve a slow analytical SQL query on a large dataset?",
  "requirements": "How do you turn an ambiguous business request into testable requirements and acceptance criteria?",
};

const idealAnswers: Record<string, string> = {
  "api-design": "Start by clarifying consumers, operations, SLAs, and failure semantics. Define resource-oriented contracts, validation, consistent errors, authentication and authorization, idempotency for writes, pagination, and versioning. Protect dependencies with timeouts and retries, add correlation IDs, metrics and tracing, document the contract, and validate it with consumer-driven contract, integration, load, and security tests.",
  "api-testing": "Build a risk-based pyramid: contract and schema validation, positive and negative functional paths, authorization boundaries, idempotency, concurrency, dependency failures, and data integrity. Automate stable service-level checks in CI, isolate test data, monitor latency and errors, and reserve a smaller set of end-to-end tests for critical flows.",
  "automation-architecture": "Separate test intent from tooling with domain-focused layers, reusable fixtures, deterministic data builders, and clear component boundaries. Optimize for reliable parallel execution, actionable reporting, versioned dependencies, CI selection, and ownership. Measure flake rate, runtime, defect detection, and maintenance cost.",
  "system-design": "Clarify scale, latency, availability, consistency, security, and cost requirements. Draw clients, gateways, services, storage, caches, queues, and observability boundaries. Explain data flow, partitioning, failure recovery, bottlenecks, tradeoffs, capacity estimates, and how the design evolves as traffic grows.",
  "data-structures": "Explain the approach before coding, choose data structures deliberately, state invariants, handle empty and boundary inputs, and walk through an example. Conclude with estimated time and space complexity and the tradeoff versus a simpler alternative.",
  "behavioral-leadership": "Use a concise STAR structure: establish the stakes and your responsibility, describe the specific influence and decisions you personally drove, explain conflict or tradeoffs, and quantify the result. Close with what you learned and would repeat or change.",
};

export function idealAnswerFor(ontologyLeafId: string, skillName = "this skill") {
  return idealAnswers[ontologyLeafId] ?? `A strong ${skillName} answer states assumptions, presents a structured approach, covers important tradeoffs and failure modes, gives a concrete example, and explains how the outcome would be validated.`;
}

export function generateQuestion(input: {
  ontologyLeafId: string;
  mode: QuestionMode;
  difficulty: QuestionDifficulty;
}): GeneratedQuestion {
  const skill = ONTOLOGY.find((item) => item.id === input.ontologyLeafId);
  if (!skill) throw new Error("Unknown ontology skill.");
  const base = prompts[skill.id] ?? `How would you approach a realistic ${skill.name} problem and explain your tradeoffs?`;
  const depth = input.difficulty === "easy"
    ? "Start with the fundamentals and one concrete example."
    : input.difficulty === "hard"
      ? "Include failure modes, tradeoffs, observability, and how your approach changes at scale."
      : "Explain the major tradeoffs and how you would validate the outcome.";
  const modeLead = input.mode === "mock" ? "In an interview-style response, " : "For this focused drill, ";
  const answerType = skill.id === "data-structures" ? "code" : skill.id === "system-design" ? "diagram" : "text";
  const dimensions = answerType === "code"
    ? ["reasoning-based correctness", "estimated time and space complexity", "edge-case awareness", "communication of approach"]
    : answerType === "diagram"
      ? ["scalability reasoning", "tradeoff awareness", "bottleneck identification", "diagram clarity"]
      : ["technical accuracy", "structured reasoning", "tradeoff awareness", "concrete evidence"];
  return {
    answerType,
    questionText: `${modeLead}${base} ${depth}`,
    idealAnswer: idealAnswerFor(skill.id, skill.name),
    evaluationRubric: {
      dimensions,
      strongAnswerSignals: ["states assumptions", "covers risks", "explains validation", "communicates decisions clearly"],
    },
    followUpHints: ["Ask for a concrete example.", "Probe the largest failure mode.", "Ask what they would measure."],
  };
}
