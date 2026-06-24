create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  ontology_leaf_id text not null references public.ontology_skills(id) on delete restrict,
  mode varchar(20) not null,
  difficulty varchar(20) not null,
  question_text text not null,
  evaluation_rubric jsonb not null default '{}'::jsonb,
  follow_up_hints jsonb not null default '[]'::jsonb,
  source varchar(30) not null default 'generated',
  hit_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ontology_leaf_id, mode, difficulty),
  constraint question_bank_mode check (mode in ('drill', 'mock')),
  constraint question_bank_difficulty check (difficulty in ('easy', 'medium', 'hard')),
  constraint question_bank_text_not_blank check (length(trim(question_text)) > 0)
);

create index question_bank_lookup_idx
  on public.question_bank (ontology_leaf_id, mode, difficulty);

create trigger question_bank_set_updated_at
before update on public.question_bank
for each row execute function public.set_updated_at();

alter table public.question_bank enable row level security;

create policy "Authenticated users can read cached questions"
on public.question_bank for select to authenticated using (true);

revoke insert, update, delete on public.question_bank from anon, authenticated;

comment on table public.question_bank is
  'Portable cache keyed only by ontology leaf, mode, and difficulty. Runtime context is never stored here.';
