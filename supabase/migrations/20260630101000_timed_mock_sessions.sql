alter table public.practice_sessions
  add column if not exists duration_minutes integer,
  add column if not exists planned_question_count integer;

alter table public.practice_sessions
  add constraint practice_sessions_duration_check check (duration_minutes is null or duration_minutes in (30, 60)),
  add constraint practice_sessions_question_count_check check (planned_question_count is null or planned_question_count between 1 and 20);

comment on column public.practice_sessions.duration_minutes is 'Selected mock-interview duration; null for drills.';
comment on column public.practice_sessions.planned_question_count is 'Number of questions prepared when the mock starts.';
