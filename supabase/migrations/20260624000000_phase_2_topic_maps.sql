create table public.ontology_skills (
  id text primary key,
  name varchar(120) not null,
  domain varchar(80) not null,
  description text not null,
  parent_id text references public.ontology_skills(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.topic_trees (
  id uuid primary key default gen_random_uuid(),
  prep_context_id uuid not null unique references public.prep_contexts(id) on delete cascade,
  tree jsonb not null,
  recommended_path text[] not null default '{}',
  signal_summary jsonb not null default '{}'::jsonb,
  generated_by varchar(40) not null default 'deterministic-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topic_skill_mappings (
  id uuid primary key default gen_random_uuid(),
  topic_tree_id uuid not null references public.topic_trees(id) on delete cascade,
  ontology_leaf_id text not null references public.ontology_skills(id) on delete restrict,
  topic_key text not null,
  weight numeric(5, 4) not null,
  selected boolean not null default true,
  rationale text not null,
  created_at timestamptz not null default now(),
  unique (topic_tree_id, ontology_leaf_id),
  constraint topic_skill_weight_range check (weight > 0 and weight <= 1)
);

create index topic_skill_mappings_tree_weight_idx
  on public.topic_skill_mappings (topic_tree_id, weight desc);

create trigger topic_trees_set_updated_at
before update on public.topic_trees
for each row execute function public.set_updated_at();

alter table public.ontology_skills enable row level security;
alter table public.topic_trees enable row level security;
alter table public.topic_skill_mappings enable row level security;

create policy "Anyone can read the skill ontology"
on public.ontology_skills for select to anon, authenticated using (true);

create policy "Users can read topic trees for their contexts"
on public.topic_trees for select to authenticated
using (exists (
  select 1 from public.prep_contexts
  where prep_contexts.id = topic_trees.prep_context_id
    and prep_contexts.user_id = (select auth.uid())
));

create policy "Users can read mappings for their topic trees"
on public.topic_skill_mappings for select to authenticated
using (exists (
  select 1 from public.topic_trees
  join public.prep_contexts on prep_contexts.id = topic_trees.prep_context_id
  where topic_trees.id = topic_skill_mappings.topic_tree_id
    and prep_contexts.user_id = (select auth.uid())
));

insert into public.ontology_skills (id, name, domain, description, parent_id) values
  ('software-engineering', 'Software Engineering', 'Engineering', 'Core software construction and design practices.', null),
  ('programming', 'Programming Fundamentals', 'Engineering', 'Language fluency, clean code, debugging, and maintainability.', 'software-engineering'),
  ('data-structures', 'Data Structures & Algorithms', 'Engineering', 'Complexity, algorithms, and problem-solving tradeoffs.', 'software-engineering'),
  ('system-design', 'System Design', 'Architecture', 'Scalable, reliable, and maintainable distributed systems.', 'software-engineering'),
  ('api-design', 'API Design', 'Architecture', 'REST, event contracts, versioning, and service boundaries.', 'software-engineering'),
  ('databases', 'Databases', 'Data', 'Relational and NoSQL design, transactions, and query performance.', 'software-engineering'),
  ('cloud-devops', 'Cloud & DevOps', 'Platform', 'Cloud services, containers, observability, and operations.', 'software-engineering'),
  ('security', 'Application Security', 'Security', 'Threat modeling, secure coding, auth, and data protection.', 'software-engineering'),
  ('behavioral-leadership', 'Behavioral Leadership', 'Leadership', 'Ownership, influence, communication, and conflict resolution.', 'software-engineering'),
  ('data-engineering', 'Data Engineering', 'Data', 'Reliable analytical data systems and platforms.', null),
  ('sql', 'Advanced SQL', 'Data', 'Complex querying, optimization, and analytical SQL.', 'data-engineering'),
  ('data-pipelines', 'Data Pipelines', 'Data', 'Batch and streaming ingestion, orchestration, and reliability.', 'data-engineering'),
  ('data-modeling', 'Data Modeling', 'Data', 'Dimensional, normalized, and analytical model design.', 'data-engineering'),
  ('distributed-data', 'Distributed Data Processing', 'Data', 'Parallel data workloads, partitions, and fault tolerance.', 'data-engineering'),
  ('data-quality', 'Data Quality & Governance', 'Data', 'Validation, lineage, observability, and governance.', 'data-engineering'),
  ('warehousing', 'Cloud Warehousing', 'Data', 'Warehouse and lakehouse architecture and optimization.', 'data-engineering'),
  ('business-analysis', 'Business Analysis', 'Analysis', 'Turning business needs into actionable product change.', null),
  ('requirements', 'Requirements Engineering', 'Analysis', 'Elicitation, user stories, acceptance criteria, and traceability.', 'business-analysis'),
  ('stakeholder-management', 'Stakeholder Management', 'Leadership', 'Alignment, facilitation, negotiation, and communication.', 'business-analysis'),
  ('process-modeling', 'Process Modeling', 'Analysis', 'Current-state analysis, future-state design, and process notation.', 'business-analysis'),
  ('business-analytics', 'Business Analytics', 'Analysis', 'Metrics, insights, reporting, and decision support.', 'business-analysis'),
  ('quality-engineering', 'Quality Engineering', 'Quality', 'Risk-based testing and modern quality practices.', null),
  ('test-strategy', 'Test Strategy', 'Quality', 'Risk analysis, coverage, quality planning, and release confidence.', 'quality-engineering'),
  ('automation-architecture', 'Automation Architecture', 'Quality', 'Maintainable test frameworks, patterns, and tooling.', 'quality-engineering'),
  ('api-testing', 'API Testing', 'Quality', 'Contract, integration, negative, and service-level testing.', 'quality-engineering'),
  ('ui-automation', 'UI Automation', 'Quality', 'Reliable browser and application workflow automation.', 'quality-engineering'),
  ('ci-cd-testing', 'CI/CD Quality Gates', 'Quality', 'Pipeline integration, test selection, and release gates.', 'quality-engineering'),
  ('performance-testing', 'Performance Testing', 'Quality', 'Load models, bottleneck analysis, and capacity confidence.', 'quality-engineering'),
  ('security-testing', 'Security Testing', 'Security', 'Vulnerability, authorization, and abuse-case testing.', 'quality-engineering'),
  ('payments-testing', 'Payments Domain Testing', 'Domain', 'Payment flows, reconciliation, idempotency, and compliance risks.', 'quality-engineering');

comment on table public.ontology_skills is 'Portable skill ontology shared by topic maps, questions, and mastery.';
comment on table public.topic_trees is 'Context-specific weighted interview topic maps.';
comment on table public.topic_skill_mappings is 'Links generated topics to portable ontology leaves.';
