alter table public.prep_contexts
  add column if not exists resume_text text,
  add constraint prep_contexts_resume_text_length check (resume_text is null or char_length(resume_text) <= 20000);

alter table public.practice_sessions
  add column if not exists interview_round text,
  add constraint practice_sessions_interview_round_check check (interview_round is null or interview_round in ('recruiter', 'hiring-manager', 'behavioral', 'skills', 'final'));
