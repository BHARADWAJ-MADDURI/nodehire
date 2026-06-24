create table public.app_usage_daily (
  usage_date date primary key,
  successful_units integer not null default 0,
  reserved_units integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint usage_non_negative check (successful_units >= 0 and reserved_units >= 0)
);

create table public.user_provider_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider varchar(20) not null,
  encrypted_key jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider),
  constraint provider_name check (provider in ('gemini', 'openai', 'anthropic'))
);

alter table public.app_usage_daily enable row level security;
alter table public.user_provider_keys enable row level security;
revoke all on public.app_usage_daily from anon, authenticated;
revoke all on public.user_provider_keys from anon, authenticated;

create or replace function public.reserve_app_usage(p_units integer, p_ceiling integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  insert into public.app_usage_daily (usage_date, successful_units, reserved_units)
  values ((now() at time zone 'utc')::date, 0, 0) on conflict (usage_date) do nothing;
  update public.app_usage_daily
  set reserved_units = reserved_units + p_units, updated_at = now()
  where usage_date = (now() at time zone 'utc')::date
    and successful_units + reserved_units + p_units <= p_ceiling;
  get diagnostics affected = row_count;
  return affected = 1;
end; $$;

create or replace function public.finish_app_usage(p_units integer, p_success boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.app_usage_daily
  set reserved_units = greatest(0, reserved_units - p_units),
      successful_units = successful_units + case when p_success then p_units else 0 end,
      updated_at = now()
  where usage_date = (now() at time zone 'utc')::date;
end; $$;

revoke all on function public.reserve_app_usage(integer, integer) from public;
revoke all on function public.finish_app_usage(integer, boolean) from public;
comment on table public.user_provider_keys is 'Service-role-only encrypted BYOK envelopes; never client-readable.';
