import { ONTOLOGY } from "@/lib/topic-map/ontology";
import type { GeneratedQuestion, QuestionDifficulty, QuestionMode } from "./types";

const scenarios: Record<string, string> = {
  programming: "A batch processor retries failed records, but a production incident shows duplicate writes after a timeout. Walk through the code-level cause and propose an idempotent fix, including the tests you would write.",
  "data-structures": "Given a stream of test failures containing testId and timestamp, design an algorithm that returns the five most frequently failing test IDs without storing the entire stream.",
  "system-design": "Design a notification service that accepts 10,000 requests per second, delivers email and SMS, and must not send the same notification twice even when workers retry.",
  "api-design": "Design a versioned REST API for transferring money between accounts where clients may retry after a timeout. Specify the contract, idempotency behavior, errors, and compatibility strategy.",
  databases: "An order service occasionally oversells the last item when two checkouts run concurrently. Explain the transaction anomaly and design a database-level fix that preserves throughput.",
  "cloud-devops": "A Kubernetes deployment is healthy according to its process check but returns 503s for three minutes after every release. Diagnose the rollout and redesign its probes, deployment strategy, and rollback signals.",
  security: "A multi-tenant document API accepts a document ID from the URL. Describe how you would prevent and verify against one customer reading another customer's document.",
  "behavioral-leadership": "Tell me about a specific release where you opposed the planned quality or technical approach. What evidence did you use, how did you influence the decision, and what measurable outcome followed?",
  sql: "A sales table has 500 million rows and a dashboard query grouping revenue by customer and month now takes 90 seconds. Show how you would diagnose it and rewrite or index it to meet a five-second SLA.",
  "data-pipelines": "A daily customer pipeline receives late files and replays yesterday's partition, producing duplicate facts. Design the ingestion, deduplication, backfill, and alerting behavior.",
  "data-modeling": "Model orders, line items, refunds, and partial shipments for an analytics warehouse that must report revenue as originally booked and as later adjusted.",
  "distributed-data": "A Spark job processing two terabytes stalls because one customer owns 40% of all events. Diagnose the skew and propose a partitioning strategy without losing correctness.",
  "data-quality": "A source team silently changes amount from dollars to cents and downstream revenue jumps 100x. Design validation, ownership, lineage, and recovery controls that catch and contain this change.",
  warehousing: "A cloud warehouse's cost doubled while query volume stayed flat. Given large fact tables and repeated dashboard scans, identify the evidence you would collect and the concrete storage and workload changes you would test.",
  requirements: "A stakeholder asks for a dashboard that shows 'healthy customers' but teams disagree on healthy. Describe the questions, decision record, acceptance criteria, and examples you would produce before delivery.",
  "stakeholder-management": "Sales wants a feature this month, Security requires a redesign, and Engineering estimates eight weeks. Walk through how you would reach and document a decision with these three groups.",
  "process-modeling": "An insurance claim passes through email, a spreadsheet, and two approval systems, with 20% rework. Map the current state and define the evidence used to choose the first future-state improvement.",
  "business-analytics": "A product's conversion rate rose from 4% to 5% after a release, while traffic mix also changed. Explain how you would determine whether the release caused the improvement and what you would report.",
  "enterprise-risk-frameworks": "Business units use incompatible risk ratings, leaving leadership unable to compare enterprise exposure. Design a common risk taxonomy, scoring methodology, governance model, and rollout plan without erasing important local context.",
  "rcsa-controls": "A global RCSA identifies 120 controls, but owners rate nearly all of them effective without evidence. Redesign the assessment, challenge, evidence, issue, and remediation process so leadership can trust the results.",
  "risk-metrics-reporting": "The board receives 80 risk metrics with no thresholds, trends, or connection to decisions. Select a concise KRI set and design escalation and reporting that shows exposure, mitigation progress, and emerging risk.",
  "audit-assurance": "Internal audit reports a repeat finding after management marked remediation complete. Explain how you would determine why assurance failed, validate corrective action, and prevent premature closure.",
  "compliance-program-management": "A new regulatory requirement affects Legal, Finance, Product, and regional operations with a nine-month deadline. Build the compliance program plan, ownership model, milestones, dependencies, evidence, and escalation path.",
  "risk-stakeholder-governance": "A product leader accepts a high risk that Legal believes exceeds enterprise appetite. Describe how you would facilitate the decision, document accountability, escalate appropriately, and preserve the working relationship.",
  "test-strategy": "A team has two weeks to release a checkout redesign affecting pricing, inventory, payment, and confirmation. Build a risk-based test strategy and state exactly what would block release.",
  "automation-architecture": "Six teams share a UI automation framework with 3,000 tests, a 12% flake rate, and a 90-minute runtime. Propose an architecture and migration plan that reduces both without stopping feature delivery.",
  "api-testing": "A payment authorization API supports retries, reversals, and asynchronous webhooks. Define the concrete tests for duplicate requests, out-of-order events, dependency timeouts, and ledger integrity.",
  "ui-automation": "A checkout suite has 600 browser tests, a 15% flaky-failure rate, and dynamic elements whose IDs change each build. Explain how you would identify the top flake causes and refactor one unstable flow into reliable tests.",
  "ci-cd-testing": "A pull-request pipeline takes 55 minutes, so developers bypass it before releases. Design test selection and quality gates that return useful feedback within ten minutes while protecting critical flows.",
  "performance-testing": "An API meets its 300 ms latency target at 100 requests per second but degrades to eight seconds at 600. Design the load model, measurements, bottleneck investigation, and pass criteria.",
  "security-testing": "A service has user and administrator endpoints backed by the same API. Create a test plan for broken object-level authorization, privilege escalation, token expiry, and audit evidence.",
  "payments-testing": "A card authorization times out after the issuer may already have approved it. Explain the tests and reconciliation controls that prevent double charging while reaching a correct final state.",
  "oop-encapsulation": "A BankAccount object exposes its balance field and several callers modify it directly, bypassing overdraft rules. Refactor the design to enforce invariants and explain the tests that prove callers cannot corrupt state.",
  "oop-polymorphism": "A pricing service uses a growing switch statement for card, subscription, and promotional pricing. Redesign it with polymorphism and explain how a new pricing type can be added without changing existing behavior.",
  "oop-solid": "An OrderService validates input, charges a card, writes to a database, sends email, and retries failures. Identify the SOLID violations and propose concrete interfaces and responsibilities.",
  "oop-composition-inheritance": "A test framework inherits WebTest from ApiTest from BaseTest, and changing authentication breaks unrelated suites. Redesign it using composition and justify which, if any, inheritance remains.",
  "oop-design-patterns": "A notification system must select providers at runtime, retry transient failures, and add audit logging without duplicating code. Choose and apply design patterns, then explain their costs.",
  "react-lifecycle": "A React search page fetches twice in development and sometimes displays results from an older query. Explain the lifecycle behavior and implement cleanup that prevents stale updates.",
  "react-hooks": "Extract duplicated pagination and loading logic from three React components into a custom hook without hiding errors or creating stale closures. Define the hook API and dependency behavior.",
  "react-state-management": "A checkout wizard shares cart, address, and payment state across eight components. Decide what remains local, what moves to context or a store, and how you prevent unnecessary updates.",
  "react-rendering-performance": "A 5,000-row React table re-renders every row when one checkbox changes. Diagnose it with the profiler and apply memoization and state-shaping changes without introducing stale data.",
  "js-closures-scope": "A loop schedules three callbacks that all print the same index. Explain the closure and scope behavior, fix it in two ways, and describe when the captured value is created.",
  "js-prototypes-inheritance": "Two JavaScript objects unexpectedly share a mutable settings array through their prototype. Explain the lookup behavior and redesign initialization so instances cannot affect each other.",
  "js-async-event-loop": "Predict the exact output order of code containing a resolved Promise, queueMicrotask, setTimeout(0), and synchronous logging, then explain the event-loop queues that produce it.",
  "ts-type-system": "Design a TypeScript result type for success and provider-specific failures, then use generics and discriminated unions so callers must handle every case without unsafe casts.",
};

const idealAnswers: Record<string, string> = {
  "api-design": "Clarify consumers and failure semantics; use an idempotency key tied to the transfer request, an atomic ledger transaction, stable error codes, authentication and authorization, and versioned contracts. Validate with contract, concurrency, retry, load, and security tests plus tracing and reconciliation metrics.",
  "api-testing": "Cover contract validation, authorization, unique idempotency keys, repeated identical and conflicting requests, delayed and duplicated webhooks, dependency timeout ambiguity, reversals, and ledger reconciliation. Automate deterministic service tests in CI and assert both response behavior and final persisted state.",
  "automation-architecture": "Separate domain intent, drivers, fixtures, data builders, and reporting. Quarantine only with ownership and expiry, measure flake causes, move suitable coverage below UI, shard deterministic tests, and migrate suite by suite. Track flake rate, runtime, escaped defects, and maintenance effort.",
  "system-design": "Clarify delivery and latency guarantees, use durable ingestion, idempotency keys, a queue and channel workers, provider-specific retries with dead-letter handling, and a status store. Explain partitioning, rate limits, observability, reconciliation, capacity, and disaster recovery.",
  "data-structures": "Use a hash map for counts and a min-heap of size five, or a bounded streaming heavy-hitter algorithm when distinct IDs are unbounded. State invariants, tie behavior, malformed-input handling, and estimated time and space complexity.",
  "behavioral-leadership": "Use STAR with a real decision: quantify the risk, show the evidence and stakeholders, explain your personal influence and tradeoff, give the measurable result, and state what you learned.",
};

export function idealAnswerFor(ontologyLeafId: string, skillName = "this skill") {
  return idealAnswers[ontologyLeafId] ?? `A strong ${skillName} answer directly solves the stated scenario, states assumptions, gives concrete implementation or decision details, covers the most likely failure modes and tradeoffs, and defines measurable validation and success criteria.`;
}

const interviewAngles = [
  "Explain the first decisions you would make, who owns each action, and what evidence would change your approach.",
  "Now assume a senior stakeholder disputes your assessment. Show how you would challenge, align, and document the final decision.",
  "Describe the most likely way this approach could fail, the early warning signal, and the recovery plan.",
  "Give a 30-60-90 day implementation plan with concrete milestones, dependencies, and success measures.",
  "Compare two viable approaches, choose one, and defend the tradeoff to an executive audience.",
  "Assume the available data is incomplete and teams use inconsistent definitions. Explain how you would reach a defensible recommendation.",
  "Describe how you would scale the approach across regions while preserving accountability and local regulatory needs.",
  "An audit or post-incident review finds the process ineffective six months later. Diagnose why and redesign the operating model.",
  "Identify the three artifacts you would produce and explain how each one drives a decision rather than becoming paperwork.",
  "Answer with a concrete example from your experience, including conflict, your personal contribution, and a measurable result.",
];

export function generateQuestion(input: { ontologyLeafId: string; mode: QuestionMode; difficulty: QuestionDifficulty; variantIndex?: number }): GeneratedQuestion {
  const skill = ONTOLOGY.find((item) => item.id === input.ontologyLeafId);
  if (!skill) throw new Error("Unknown ontology skill.");
  const base = scenarios[skill.id] ?? `A production team reports a recurring ${skill.name} failure affecting 5% of requests after a deployment. Diagnose the likely causes, propose a specific fix, and define two measurements that prove the fix worked.`;
  const depth = input.difficulty === "easy"
    ? "Start with the key fundamentals, make one assumption explicit, and walk through one example."
    : input.difficulty === "hard"
      ? "Include scale or concurrency limits, the most dangerous failure mode, observability, rollout safety, and the tradeoff you would accept."
      : "State your assumptions, compare the main tradeoffs, and give measurable validation criteria.";
  const variantIndex = Math.max(0, input.variantIndex ?? 0);
  const angle = interviewAngles[variantIndex % interviewAngles.length];
  const additionalConstraint = variantIndex >= interviewAngles.length
    ? `For this variation, assume the program spans ${12 + variantIndex * 3} teams and leadership expects a decision within ${2 + variantIndex % 6} weeks.`
    : "";
  const codeSkills = new Set(["programming", "data-structures", "oop-encapsulation", "oop-polymorphism", "oop-solid", "oop-composition-inheritance", "oop-design-patterns", "js-closures-scope", "js-prototypes-inheritance", "js-async-event-loop", "ts-type-system"]);
  const answerType = codeSkills.has(skill.id) ? "code" : skill.id === "system-design" ? "diagram" : "text";
  const dimensions = answerType === "code"
    ? ["reasoning-based correctness", "estimated time and space complexity", "edge-case awareness", "communication of approach"]
    : answerType === "diagram"
      ? ["scalability reasoning", "tradeoff awareness", "bottleneck identification", "diagram clarity"]
      : ["technical accuracy", "structured reasoning", "tradeoff awareness", "concrete evidence"];
  return {
    answerType,
    questionText: `${base} ${depth} ${input.mode === "mock" ? angle : ""} ${additionalConstraint}`.trim(),
    idealAnswer: idealAnswerFor(skill.id, skill.name),
    evaluationRubric: { dimensions, strongAnswerSignals: ["answers the stated scenario", "uses concrete details", "covers risks", "defines validation"] },
    followUpHints: ["Ask for the exact implementation or decision.", "Probe the largest failure mode.", "Ask for a measurable success criterion."],
  };
}
