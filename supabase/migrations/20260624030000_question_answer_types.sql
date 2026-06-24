alter table public.ontology_skills
  add column answer_type varchar(20) not null default 'text',
  add constraint ontology_answer_type check (answer_type in ('text', 'code', 'diagram'));

update public.ontology_skills set answer_type = 'code' where id = 'data-structures';
update public.ontology_skills set answer_type = 'diagram' where id = 'system-design';

alter table public.question_bank
  add column answer_type varchar(20) not null default 'text',
  add column ideal_answer text,
  add constraint question_answer_type check (answer_type in ('text', 'code', 'diagram'));

update public.question_bank set answer_type = 'code' where ontology_leaf_id = 'data-structures';
update public.question_bank set answer_type = 'diagram' where ontology_leaf_id = 'system-design';
update public.question_bank set ideal_answer = 'State assumptions, present a structured approach, cover tradeoffs and failure modes, and explain how the outcome would be validated.' where ideal_answer is null;

comment on column public.question_bank.answer_type is 'Controls answer UI without changing the cache key.';
comment on column public.question_bank.ideal_answer is 'Self-comparison floor when live evaluation is unavailable.';
