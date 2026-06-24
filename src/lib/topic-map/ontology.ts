export type OntologySkill = {
  id: string;
  name: string;
  domain: string;
  description: string;
  keywords: string[];
  roleFamilies: string[];
  baseWeight: number;
  parentId?: string;
};

export type OntologyBranch = {
  id: string;
  name: string;
  domain: string;
  description: string;
};

export const ONTOLOGY_BRANCHES: OntologyBranch[] = [
  { id: "oop", name: "OOP", domain: "Engineering", description: "Object-oriented design principles and patterns." },
  { id: "react", name: "React", domain: "Frontend", description: "Component behavior, state, hooks, and rendering." },
  { id: "javascript-typescript", name: "JavaScript/TypeScript", domain: "Engineering", description: "JavaScript runtime behavior and TypeScript type safety." },
];

export const ONTOLOGY: OntologySkill[] = [
  { id: "programming", name: "Programming Fundamentals", domain: "Engineering", description: "Language fluency, clean code, debugging, and maintainability.", keywords: ["java", "python", "javascript", "typescript", "c#", "coding", "debug"], roleFamilies: ["software"], baseWeight: 0.55 },
  { id: "oop-encapsulation", name: "Encapsulation", domain: "OOP", description: "Protecting invariants and controlling state mutation.", keywords: ["oop", "object oriented", "encapsulation", "invariant"], roleFamilies: ["software", "quality"], baseWeight: 0.48, parentId: "oop" },
  { id: "oop-polymorphism", name: "Polymorphism", domain: "OOP", description: "Substitutability and behavior through stable abstractions.", keywords: ["oop", "polymorphism", "interface", "abstract class"], roleFamilies: ["software", "quality"], baseWeight: 0.46, parentId: "oop" },
  { id: "oop-solid", name: "SOLID Principles", domain: "OOP", description: "Responsibility, extensibility, substitution, interfaces, and dependency inversion.", keywords: ["solid", "single responsibility", "dependency inversion"], roleFamilies: ["software", "quality"], baseWeight: 0.5, parentId: "oop" },
  { id: "oop-composition-inheritance", name: "Composition vs Inheritance", domain: "OOP", description: "Choosing reuse and extension mechanisms deliberately.", keywords: ["composition", "inheritance", "is-a", "has-a"], roleFamilies: ["software", "quality"], baseWeight: 0.44, parentId: "oop" },
  { id: "oop-design-patterns", name: "Design Patterns", domain: "OOP", description: "Applying reusable collaboration patterns without over-engineering.", keywords: ["design pattern", "strategy pattern", "factory", "observer"], roleFamilies: ["software", "quality"], baseWeight: 0.48, parentId: "oop" },
  { id: "react-lifecycle", name: "Component Lifecycle", domain: "React", description: "Mount, update, cleanup, and effect behavior.", keywords: ["react", "component lifecycle", "mount", "cleanup"], roleFamilies: ["software"], baseWeight: 0.48, parentId: "react" },
  { id: "react-hooks", name: "Hooks", domain: "React", description: "useState, useEffect, and reusable custom hooks.", keywords: ["react", "hook", "usestate", "useeffect", "custom hook"], roleFamilies: ["software"], baseWeight: 0.52, parentId: "react" },
  { id: "react-state-management", name: "State Management", domain: "React", description: "Local, shared, server, and application state boundaries.", keywords: ["react", "state management", "context", "redux", "zustand"], roleFamilies: ["software"], baseWeight: 0.5, parentId: "react" },
  { id: "react-rendering-performance", name: "Rendering & Performance", domain: "React", description: "Re-renders, memoization, profiling, and responsive interfaces.", keywords: ["react", "usememo", "usecallback", "memo", "render performance"], roleFamilies: ["software"], baseWeight: 0.46, parentId: "react" },
  { id: "js-closures-scope", name: "Closures & Scope", domain: "JavaScript/TypeScript", description: "Lexical scope, captured values, and lifetime.", keywords: ["javascript", "typescript", "closure", "scope", "hoisting"], roleFamilies: ["software", "quality"], baseWeight: 0.46, parentId: "javascript-typescript" },
  { id: "js-prototypes-inheritance", name: "Prototypes & Inheritance", domain: "JavaScript/TypeScript", description: "Prototype lookup, delegation, and instance behavior.", keywords: ["javascript", "prototype", "prototypal inheritance"], roleFamilies: ["software"], baseWeight: 0.42, parentId: "javascript-typescript" },
  { id: "js-async-event-loop", name: "Async / Event Loop", domain: "JavaScript/TypeScript", description: "Promises, tasks, microtasks, and asynchronous control flow.", keywords: ["javascript", "typescript", "async", "promise", "event loop", "microtask"], roleFamilies: ["software", "quality"], baseWeight: 0.52, parentId: "javascript-typescript" },
  { id: "ts-type-system", name: "TypeScript Type System", domain: "JavaScript/TypeScript", description: "Generics, narrowing, utility types, and safe API modeling.", keywords: ["typescript", "generic", "type narrowing", "utility type"], roleFamilies: ["software", "quality"], baseWeight: 0.5, parentId: "javascript-typescript" },
  { id: "data-structures", name: "Data Structures & Algorithms", domain: "Engineering", description: "Complexity, algorithms, and problem-solving tradeoffs.", keywords: ["algorithm", "data structure", "complexity", "leetcode"], roleFamilies: ["software"], baseWeight: 0.45 },
  { id: "system-design", name: "System Design", domain: "Architecture", description: "Scalable, reliable, and maintainable distributed systems.", keywords: ["architecture", "distributed", "scalable", "microservice", "high availability"], roleFamilies: ["software", "data"], baseWeight: 0.55 },
  { id: "api-design", name: "API Design", domain: "Architecture", description: "REST, event contracts, versioning, and service boundaries.", keywords: ["api", "rest", "graphql", "service", "contract"], roleFamilies: ["software"], baseWeight: 0.5 },
  { id: "databases", name: "Databases", domain: "Data", description: "Relational and NoSQL design, transactions, and query performance.", keywords: ["database", "postgres", "mysql", "nosql", "transaction"], roleFamilies: ["software"], baseWeight: 0.45 },
  { id: "cloud-devops", name: "Cloud & DevOps", domain: "Platform", description: "Cloud services, containers, observability, and operations.", keywords: ["aws", "azure", "gcp", "docker", "kubernetes", "cloud", "devops", "observability"], roleFamilies: ["software", "data", "quality"], baseWeight: 0.4 },
  { id: "security", name: "Application Security", domain: "Security", description: "Threat modeling, secure coding, auth, and data protection.", keywords: ["security", "oauth", "auth", "encryption", "pci", "compliance"], roleFamilies: ["software"], baseWeight: 0.35 },
  { id: "behavioral-leadership", name: "Behavioral Leadership", domain: "Leadership", description: "Ownership, influence, communication, and conflict resolution.", keywords: ["lead", "mentor", "stakeholder", "ownership", "collaborate", "influence"], roleFamilies: ["software", "data", "quality", "business"], baseWeight: 0.45 },
  { id: "sql", name: "Advanced SQL", domain: "Data", description: "Complex querying, optimization, and analytical SQL.", keywords: ["sql", "query", "stored procedure"], roleFamilies: ["data", "business"], baseWeight: 0.65 },
  { id: "data-pipelines", name: "Data Pipelines", domain: "Data", description: "Batch and streaming ingestion, orchestration, and reliability.", keywords: ["etl", "elt", "pipeline", "airflow", "kafka", "streaming", "ingestion"], roleFamilies: ["data"], baseWeight: 0.7 },
  { id: "data-modeling", name: "Data Modeling", domain: "Data", description: "Dimensional, normalized, and analytical model design.", keywords: ["data model", "dimensional", "star schema", "schema"], roleFamilies: ["data", "business"], baseWeight: 0.55 },
  { id: "distributed-data", name: "Distributed Data Processing", domain: "Data", description: "Parallel data workloads, partitions, and fault tolerance.", keywords: ["spark", "hadoop", "flink", "distributed", "partition"], roleFamilies: ["data"], baseWeight: 0.55 },
  { id: "data-quality", name: "Data Quality & Governance", domain: "Data", description: "Validation, lineage, observability, and governance.", keywords: ["data quality", "lineage", "governance", "catalog", "validation"], roleFamilies: ["data"], baseWeight: 0.5 },
  { id: "warehousing", name: "Cloud Warehousing", domain: "Data", description: "Warehouse and lakehouse architecture and optimization.", keywords: ["snowflake", "bigquery", "redshift", "databricks", "warehouse", "lakehouse"], roleFamilies: ["data"], baseWeight: 0.55 },
  { id: "requirements", name: "Requirements Engineering", domain: "Analysis", description: "Elicitation, user stories, acceptance criteria, and traceability.", keywords: ["requirements", "user stories", "acceptance criteria", "elicitation", "traceability"], roleFamilies: ["business"], baseWeight: 0.75 },
  { id: "stakeholder-management", name: "Stakeholder Management", domain: "Leadership", description: "Alignment, facilitation, negotiation, and communication.", keywords: ["stakeholder", "facilitat", "workshop", "negotiate", "communication"], roleFamilies: ["business"], baseWeight: 0.65 },
  { id: "process-modeling", name: "Process Modeling", domain: "Analysis", description: "Current-state analysis, future-state design, and process notation.", keywords: ["process", "bpmn", "workflow", "current state", "future state"], roleFamilies: ["business"], baseWeight: 0.55 },
  { id: "business-analytics", name: "Business Analytics", domain: "Analysis", description: "Metrics, insights, reporting, and decision support.", keywords: ["analytics", "dashboard", "kpi", "reporting", "insight"], roleFamilies: ["business"], baseWeight: 0.45 },
  { id: "test-strategy", name: "Test Strategy", domain: "Quality", description: "Risk analysis, coverage, quality planning, and release confidence.", keywords: ["test strategy", "quality", "risk based", "coverage", "test plan"], roleFamilies: ["quality"], baseWeight: 0.7 },
  { id: "automation-architecture", name: "Automation Architecture", domain: "Quality", description: "Maintainable test frameworks, patterns, and tooling.", keywords: ["automation", "framework", "selenium", "playwright", "cypress", "sdet"], roleFamilies: ["quality"], baseWeight: 0.8 },
  { id: "api-testing", name: "API Testing", domain: "Quality", description: "Contract, integration, negative, and service-level testing.", keywords: ["api testing", "rest assured", "postman", "contract testing", "service testing", "api"], roleFamilies: ["quality"], baseWeight: 0.7 },
  { id: "ui-automation", name: "UI Automation", domain: "Quality", description: "Reliable browser and application workflow automation.", keywords: ["selenium", "playwright", "cypress", "ui automation", "browser"], roleFamilies: ["quality"], baseWeight: 0.55 },
  { id: "ci-cd-testing", name: "CI/CD Quality Gates", domain: "Quality", description: "Pipeline integration, test selection, and release gates.", keywords: ["ci/cd", "cicd", "jenkins", "github actions", "pipeline", "quality gate"], roleFamilies: ["quality"], baseWeight: 0.6 },
  { id: "performance-testing", name: "Performance Testing", domain: "Quality", description: "Load models, bottleneck analysis, and capacity confidence.", keywords: ["performance", "load test", "jmeter", "gatling", "k6"], roleFamilies: ["quality"], baseWeight: 0.4 },
  { id: "security-testing", name: "Security Testing", domain: "Security", description: "Vulnerability, authorization, and abuse-case testing.", keywords: ["security testing", "owasp", "vulnerability", "penetration"], roleFamilies: ["quality"], baseWeight: 0.4 },
  { id: "payments-testing", name: "Payments Domain Testing", domain: "Domain", description: "Payment flows, reconciliation, idempotency, and compliance risks.", keywords: ["payment", "visa", "mastercard", "card", "transaction", "fintech", "pci"], roleFamilies: ["quality", "software", "business"], baseWeight: 0.35 },
];
