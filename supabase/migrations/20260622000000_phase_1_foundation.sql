create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.anonymous_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint anonymous_session_expiry_after_creation check (expires_at > created_at)
);

create table public.prep_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id uuid references public.anonymous_sessions(id) on delete cascade,
  company varchar(100) not null,
  role varchar(150) not null,
  job_description text not null,
  seniority varchar(80),
  interview_date date,
  notes varchar(2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prep_context_company_not_blank check (length(trim(company)) > 0),
  constraint prep_context_role_not_blank check (length(trim(role)) > 0),
  constraint prep_context_job_description_length check (
    length(trim(job_description)) > 0 and length(job_description) <= 50000
  ),
  constraint prep_context_has_one_owner check (
    (user_id is not null and anonymous_session_id is null)
    or (user_id is null and anonymous_session_id is not null)
  )
);

create index prep_contexts_user_updated_idx
  on public.prep_contexts (user_id, updated_at desc)
  where user_id is not null;

create index prep_contexts_anonymous_updated_idx
  on public.prep_contexts (anonymous_session_id, updated_at desc)
  where anonymous_session_id is not null;

create index anonymous_sessions_expiry_idx
  on public.anonymous_sessions (expires_at)
  where claimed_by is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger prep_contexts_set_updated_at
before update on public.prep_contexts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.anonymous_sessions enable row level security;
alter table public.prep_contexts enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own prep contexts"
on public.prep_contexts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own prep contexts"
on public.prep_contexts for insert
to authenticated
with check ((select auth.uid()) = user_id and anonymous_session_id is null);

create policy "Users can update their own prep contexts"
on public.prep_contexts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and anonymous_session_id is null);

create policy "Users can delete their own prep contexts"
on public.prep_contexts for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.anonymous_sessions from anon, authenticated;
revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;

comment on table public.anonymous_sessions is
  'Server-only anonymous ownership records. Client roles never receive direct access.';

comment on table public.prep_contexts is
  'Interview targets owned by either an authenticated user or one signed anonymous session.';
