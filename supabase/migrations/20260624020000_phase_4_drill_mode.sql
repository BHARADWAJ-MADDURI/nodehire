create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  prep_context_id uuid not null references public.prep_contexts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id uuid references public.anonymous_sessions(id) on delete cascade,
  mode varchar(20) not null default 'drill',
  status varchar(20) not null default 'active',
  difficulty varchar(20) not null default 'medium',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint practice_session_owner check ((user_id is not null and anonymous_session_id is null) or (user_id is null and anonymous_session_id is not null)),
  constraint practice_session_mode check (mode in ('drill', 'mock')),
  constraint practice_session_status check (status in ('active', 'completed', 'abandoned')),
  constraint practice_session_difficulty check (difficulty in ('easy', 'medium', 'hard'))
);

create table public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  question_id uuid not null references public.question_bank(id) on delete restrict,
  ontology_leaf_id text not null references public.ontology_skills(id) on delete restrict,
  sequence_number integer not null,
  answer_text text,
  prompt_override text,
  score numeric(5, 2),
  evaluation jsonb,
  is_follow_up boolean not null default false,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  unique (session_id, sequence_number),
  constraint session_question_score check (score is null or (score >= 0 and score <= 100))
);

create table public.skill_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id uuid references public.anonymous_sessions(id) on delete cascade,
  ontology_leaf_id text not null references public.ontology_skills(id) on delete restrict,
  mastery_score numeric(5, 2) not null default 0,
  evidence_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint skill_mastery_owner check ((user_id is not null and anonymous_session_id is null) or (user_id is null and anonymous_session_id is not null)),
  constraint skill_mastery_score check (mastery_score >= 0 and mastery_score <= 100)
);

create unique index skill_mastery_user_leaf_idx on public.skill_mastery(user_id, ontology_leaf_id) where user_id is not null;
create unique index skill_mastery_anon_leaf_idx on public.skill_mastery(anonymous_session_id, ontology_leaf_id) where anonymous_session_id is not null;

create table public.weakness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id uuid references public.anonymous_sessions(id) on delete cascade,
  ontology_leaf_id text not null references public.ontology_skills(id) on delete restrict,
  weakness_score numeric(5, 2) not null default 100,
  evidence_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint weakness_profile_owner check ((user_id is not null and anonymous_session_id is null) or (user_id is null and anonymous_session_id is not null)),
  constraint weakness_score_range check (weakness_score >= 0 and weakness_score <= 100)
);

create unique index weakness_user_leaf_idx on public.weakness_profiles(user_id, ontology_leaf_id) where user_id is not null;
create unique index weakness_anon_leaf_idx on public.weakness_profiles(anonymous_session_id, ontology_leaf_id) where anonymous_session_id is not null;

alter table public.practice_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.skill_mastery enable row level security;
alter table public.weakness_profiles enable row level security;

create policy "Users manage their practice sessions" on public.practice_sessions for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users read their session questions" on public.session_questions for select to authenticated
using (exists (select 1 from public.practice_sessions where practice_sessions.id = session_questions.session_id and practice_sessions.user_id = (select auth.uid())));
create policy "Users read their mastery" on public.skill_mastery for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read their weaknesses" on public.weakness_profiles for select to authenticated using ((select auth.uid()) = user_id);

comment on table public.skill_mastery is 'Portable ontology mastery only; readiness is computed at read time.';
