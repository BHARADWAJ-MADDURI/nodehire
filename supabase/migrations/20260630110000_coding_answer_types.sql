update public.ontology_skills
set answer_type = 'code'
where id in ('programming', 'data-structures', 'oop-encapsulation', 'oop-polymorphism', 'oop-solid', 'oop-composition-inheritance', 'oop-design-patterns', 'js-closures-scope', 'js-prototypes-inheritance', 'js-async-event-loop', 'ts-type-system');

update public.question_bank
set answer_type = 'code'
where ontology_leaf_id in ('programming', 'data-structures', 'oop-encapsulation', 'oop-polymorphism', 'oop-solid', 'oop-composition-inheritance', 'oop-design-patterns', 'js-closures-scope', 'js-prototypes-inheritance', 'js-async-event-loop', 'ts-type-system');
