export type OntologySkill = {
  id: string;
  name: string;
  domain: string;
  description: string;
  keywords: string[];
  roleFamilies: string[];
  baseWeight: number;
};

export const ONTOLOGY: OntologySkill[] = [
  { id: "programming", name: "Programming Fundamentals", domain: "Engineering", description: "Language fluency, clean code, debugging, and maintainability.", keywords: ["java", "python", "javascript", "typescript", "c#", "coding", "debug"], roleFamilies: ["software"], baseWeight: 0.55 },
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
