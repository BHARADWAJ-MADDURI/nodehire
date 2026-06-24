-- The ontology already uses stable text IDs and a self-referencing parent_id.
-- Branch rows group drillable sub-leaves; cache and mastery continue to use leaf IDs.
insert into public.ontology_skills (id, name, domain, description, parent_id) values
  ('oop', 'OOP', 'Engineering', 'Object-oriented design principles and patterns.', null),
  ('react', 'React', 'Frontend', 'Component behavior, state, hooks, and rendering.', null),
  ('javascript-typescript', 'JavaScript/TypeScript', 'Engineering', 'JavaScript runtime behavior and TypeScript type safety.', null)
on conflict (id) do update set name = excluded.name, domain = excluded.domain, description = excluded.description, parent_id = excluded.parent_id;

insert into public.ontology_skills (id, name, domain, description, parent_id) values
  ('oop-encapsulation', 'Encapsulation', 'OOP', 'Protecting invariants and controlling state mutation.', 'oop'),
  ('oop-polymorphism', 'Polymorphism', 'OOP', 'Substitutability and behavior through stable abstractions.', 'oop'),
  ('oop-solid', 'SOLID Principles', 'OOP', 'Responsibility, extensibility, substitution, interfaces, and dependency inversion.', 'oop'),
  ('oop-composition-inheritance', 'Composition vs Inheritance', 'OOP', 'Choosing reuse and extension mechanisms deliberately.', 'oop'),
  ('oop-design-patterns', 'Design Patterns', 'OOP', 'Applying reusable collaboration patterns without over-engineering.', 'oop'),
  ('react-lifecycle', 'Component Lifecycle', 'React', 'Mount, update, cleanup, and effect behavior.', 'react'),
  ('react-hooks', 'Hooks', 'React', 'useState, useEffect, and reusable custom hooks.', 'react'),
  ('react-state-management', 'State Management', 'React', 'Local, shared, server, and application state boundaries.', 'react'),
  ('react-rendering-performance', 'Rendering & Performance', 'React', 'Re-renders, memoization, profiling, and responsive interfaces.', 'react'),
  ('js-closures-scope', 'Closures & Scope', 'JavaScript/TypeScript', 'Lexical scope, captured values, and lifetime.', 'javascript-typescript'),
  ('js-prototypes-inheritance', 'Prototypes & Inheritance', 'JavaScript/TypeScript', 'Prototype lookup, delegation, and instance behavior.', 'javascript-typescript'),
  ('js-async-event-loop', 'Async / Event Loop', 'JavaScript/TypeScript', 'Promises, tasks, microtasks, and asynchronous control flow.', 'javascript-typescript'),
  ('ts-type-system', 'TypeScript Type System', 'JavaScript/TypeScript', 'Generics, narrowing, utility types, and safe API modeling.', 'javascript-typescript')
on conflict (id) do update set name = excluded.name, domain = excluded.domain, description = excluded.description, parent_id = excluded.parent_id;

comment on column public.ontology_skills.parent_id is
  'Null for grouping branches; set for drillable leaves. Questions and mastery target drillable leaves only.';
