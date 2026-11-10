-- SAYING. account, progress, diary and partner extension.
-- Existing tables are preserved. Run after schema.sql and the existing progress table.
alter table public.profiles add column if not exists email text;

create table if not exists public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_level public.learning_level not null default 'beginner',
  current_pattern_id integer,
  current_unit smallint not null default 1,
  completed_units integer[] not null default '{}',
  total_learning_seconds integer not null default 0,
  streak_days integer not null default 0,
  last_learning_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_date date not null default current_date,
  planned_minutes smallint not null check (planned_minutes in (10,20,30)),
  actual_seconds integer not null default 0,
  pattern_ids integer[] not null default '{}',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id integer not null,
  prompt text not null,
  answer text not null,
  is_correct boolean,
  needs_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diary_date date not null default current_date,
  original_text text not null,
  korean_intent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diary_feedback (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null unique references public.daily_diaries(id) on delete cascade,
  grammar_feedback text,
  natural_expression text,
  additional_learning text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_expressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diary_id uuid references public.daily_diaries(id) on delete set null,
  expression text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.study_partners (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, partner_id),
  check (requester_id <> partner_id)
);

alter table public.learning_progress enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.daily_diaries enable row level security;
alter table public.diary_feedback enable row level security;
alter table public.saved_expressions enable row level security;
alter table public.study_partners enable row level security;

drop policy if exists "own learning progress" on public.learning_progress;
create policy "own learning progress" on public.learning_progress for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own learning sessions" on public.learning_sessions;
create policy "own learning sessions" on public.learning_sessions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own exercise attempts" on public.exercise_attempts;
create policy "own exercise attempts" on public.exercise_attempts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own diaries" on public.daily_diaries;
create policy "own diaries" on public.daily_diaries for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own diary feedback" on public.diary_feedback;
create policy "own diary feedback" on public.diary_feedback for all using (exists(select 1 from public.daily_diaries d where d.id=diary_id and d.user_id=auth.uid())) with check (exists(select 1 from public.daily_diaries d where d.id=diary_id and d.user_id=auth.uid()));
drop policy if exists "own expressions" on public.saved_expressions;
create policy "own expressions" on public.saved_expressions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "partners manage own requests" on public.study_partners;
create policy "partners manage own requests" on public.study_partners for all using (auth.uid()=requester_id or auth.uid()=partner_id) with check (auth.uid()=requester_id or auth.uid()=partner_id);

-- Partner progress is intentionally exposed only through this restricted view.
create or replace view public.partner_progress_summary
with (security_invoker = true) as
select p.id as partner_id, p.nickname, p.level, lp.total_learning_seconds,
       lp.streak_days, lp.last_learning_date,
       (select count(*) from public.user_pattern_progress upp where upp.user_id=p.id) as completed_patterns
from public.profiles p
join public.learning_progress lp on lp.user_id=p.id
where exists (
  select 1 from public.study_partners sp
  where sp.status='accepted'
    and ((sp.requester_id=auth.uid() and sp.partner_id=p.id) or (sp.partner_id=auth.uid() and sp.requester_id=p.id))
);
revoke all on public.partner_progress_summary from anon;
grant select on public.partner_progress_summary to authenticated;

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid()=id);

create or replace function public.request_partner_by_email(target_email text)
returns public.study_partners
language plpgsql security definer set search_path = public as $$
declare target_id uuid; result public.study_partners;
begin
  select id into target_id from public.profiles where lower(email)=lower(target_email);
  if target_id is null then raise exception 'PARTNER_NOT_FOUND'; end if;
  if target_id = auth.uid() then raise exception 'CANNOT_INVITE_SELF'; end if;
  insert into public.study_partners(requester_id, partner_id)
  values (auth.uid(), target_id)
  on conflict (requester_id, partner_id) do update set status='pending', updated_at=now()
  returning * into result;
  return result;
end; $$;
revoke all on function public.request_partner_by_email(text) from public;
grant execute on function public.request_partner_by_email(text) to authenticated;

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, nickname, email) values (new.id, coalesce(new.raw_user_meta_data->>'nickname','SAYING learner'), new.email)
  on conflict (id) do update set email=excluded.email;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_saying on auth.users;
create trigger on_auth_user_created_saying after insert on auth.users for each row execute procedure public.sync_profile_email();
