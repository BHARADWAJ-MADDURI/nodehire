insert into public.ontology_skills (id, name, domain, description, parent_id) values
  ('governance-risk-compliance', 'Governance, Risk & Compliance', 'Risk & Compliance', 'Enterprise risk governance, controls, assurance, reporting, and compliance programs.', null)
on conflict (id) do update set name = excluded.name, domain = excluded.domain, description = excluded.description, parent_id = excluded.parent_id;

insert into public.ontology_skills (id, name, domain, description, parent_id) values
  ('enterprise-risk-frameworks', 'Enterprise Risk Frameworks', 'Risk & Compliance', 'Enterprise risk taxonomy, methodology, governance, and accountability.', 'governance-risk-compliance'),
  ('rcsa-controls', 'RCSA & Control Design', 'Risk & Compliance', 'Risk and Control Self-Assessments, control design, testing, and remediation.', 'governance-risk-compliance'),
  ('risk-metrics-reporting', 'Risk Metrics & Board Reporting', 'Risk & Compliance', 'KRIs, trends, issue status, executive reporting, and board communication.', 'governance-risk-compliance'),
  ('audit-assurance', 'Audit & Assurance', 'Risk & Compliance', 'Audit readiness, evidence, assurance, findings, and remediation validation.', 'governance-risk-compliance'),
  ('compliance-program-management', 'Compliance Program Management', 'Risk & Compliance', 'Cross-functional compliance programs, regulatory alignment, and sustainable operating processes.', 'governance-risk-compliance'),
  ('risk-stakeholder-governance', 'Risk Stakeholder Governance', 'Risk & Compliance', 'Influencing risk owners and coordinating Legal, Finance, Product, and leadership.', 'governance-risk-compliance')
on conflict (id) do update set name = excluded.name, domain = excluded.domain, description = excluded.description, parent_id = excluded.parent_id;
