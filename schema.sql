-- SAYING. MVP1 / Supabase PostgreSQL schema
-- Supabase Dashboard의 SQL Editor에서 실행하세요.
create extension if not exists pgcrypto;

create type public.learning_level as enum ('beginner','intermediate','advanced');
create type public.content_status as enum ('draft','review','approved','published');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  level public.learning_level not null default 'beginner',
  default_minutes smallint not null default 20 check (default_minutes in (10,20,30)),
  daily_goal smallint not null default 1 check (daily_goal between 1 and 20),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.patterns (
  id bigint generated always as identity primary key,
  level public.learning_level not null, title text not null, base_sentence text not null,
  translation_ko text not null, grammar_note text not null, usage_note text,
  source_note text, status public.content_status not null default 'draft',
  reviewed_at timestamptz, published_at timestamptz, created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.pattern_variations (
  id bigint generated always as identity primary key, pattern_id bigint not null references public.patterns(id) on delete cascade,
  sentence text not null, translation_ko text not null, sort_order smallint not null default 0
);

create table public.practice_items (
  id bigint generated always as identity primary key, pattern_id bigint not null references public.patterns(id) on delete cascade,
  prompt_ko text not null, answer text not null, accepted_answers text[] not null default '{}', explanation text
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  level public.learning_level not null, planned_minutes smallint not null check (planned_minutes in (10,20,30)),
  current_step smallint not null default 1 check (current_step between 1 and 5), actual_seconds integer not null default 0,
  completed_at timestamptz, created_at timestamptz not null default now()
);

create table public.attempts (
  id bigint generated always as identity primary key, user_id uuid not null references public.profiles(id) on delete cascade,
  practice_item_id bigint not null references public.practice_items(id) on delete cascade, answer text not null,
  is_correct boolean, self_assessed boolean not null default false, attempted_at timestamptz not null default now()
);

create table public.study_rooms (
  id uuid primary key default gen_random_uuid(), created_by uuid not null references public.profiles(id),
  invite_code_hash text, invite_expires_at timestamptz, invite_uses smallint not null default 0,
  created_at timestamptz not null default now()
);
create table public.study_room_members (
  room_id uuid references public.study_rooms(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), primary key(room_id,user_id)
);
create table public.shared_sentences (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  sentence text not null, is_public boolean not null default false, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.patterns enable row level security;
alter table public.pattern_variations enable row level security;
alter table public.practice_items enable row level security;
alter table public.study_sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.study_rooms enable row level security;
alter table public.study_room_members enable row level security;
alter table public.shared_sentences enable row level security;

create policy "published patterns readable" on public.patterns for select using (status = 'published');
create policy "published variations readable" on public.pattern_variations for select using (exists(select 1 from public.patterns p where p.id=pattern_id and p.status='published'));
create policy "published practices readable" on public.practice_items for select using (exists(select 1 from public.patterns p where p.id=pattern_id and p.status='published'));
create policy "own profile read" on public.profiles for select using (auth.uid()=id);
create policy "own profile update" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id and is_admin=(select is_admin from public.profiles where id=auth.uid()));
create policy "own sessions all" on public.study_sessions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own attempts all" on public.attempts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own shared sentences all" on public.shared_sentences for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "room members readable" on public.study_room_members for select using (user_id=auth.uid() or exists(select 1 from public.study_room_members mine where mine.room_id=study_room_members.room_id and mine.user_id=auth.uid()));
create policy "room public sentences readable" on public.shared_sentences for select using (is_public and exists(select 1 from public.study_room_members me join public.study_room_members them using(room_id) where me.user_id=auth.uid() and them.user_id=shared_sentences.user_id));

-- 관리자 승격은 service_role을 사용하는 신뢰된 서버/SQL Editor에서만 수행하세요.
-- update public.profiles set is_admin=true where id='USER_UUID';
