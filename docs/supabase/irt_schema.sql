-- maTH IRT adaptive learning schema
-- Run in Supabase SQL editor after authentication/RLS policy decisions are finalized.

create table if not exists public.math_items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null unique,
  topic text not null,
  grade_band text,
  problem_types text[] not null default '{}',
  skill_tags text[] not null default '{}',
  irt_model text not null default 'rasch',
  irt_b numeric not null default 0,
  payload jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null,
  local_profile_id text not null default 'local-child',
  local_attempt_id text,
  item_id text not null,
  topic text not null,
  problem_types text[] not null default '{}',
  skill_tags text[] not null default '{}',
  selected_answer text,
  correct boolean not null,
  hint_level integer not null default 0,
  step_success_rate numeric,
  response_score numeric not null,
  theta_before numeric,
  theta_after numeric,
  standard_error_after numeric,
  error_type text,
  elapsed_seconds integer,
  created_at timestamptz not null default now()
);

alter table public.learning_attempts
add column if not exists local_profile_id text not null default 'local-child';

alter table public.learning_attempts
drop constraint if exists learning_attempts_item_id_fkey;

alter table public.learning_attempts
alter column item_id type text;

drop index if exists public.learning_attempts_learner_local_attempt_idx;

create unique index learning_attempts_learner_local_attempt_idx
on public.learning_attempts(learner_id, local_profile_id, local_attempt_id)
where local_attempt_id is not null;

create table if not exists public.learner_skill_states (
  learner_id uuid not null,
  local_profile_id text not null default 'local-child',
  topic text not null,
  theta numeric not null default 0,
  standard_error numeric not null default 1,
  attempt_count integer not null default 0,
  skill_states jsonb not null default '{}'::jsonb,
  last_item_ids text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (learner_id, local_profile_id, topic)
);

alter table public.learner_skill_states
add column if not exists local_profile_id text not null default 'local-child';

alter table public.learner_skill_states
drop constraint if exists learner_skill_states_pkey;

alter table public.learner_skill_states
add primary key (learner_id, local_profile_id, topic);

alter table public.math_items enable row level security;
alter table public.learning_attempts enable row level security;
alter table public.learner_skill_states enable row level security;

drop policy if exists "Read active math items" on public.math_items;
create policy "Read active math items"
on public.math_items
for select
using (is_active = true);

drop policy if exists "Learners read own attempts" on public.learning_attempts;
create policy "Learners read own attempts"
on public.learning_attempts
for select
using (auth.uid() = learner_id);

drop policy if exists "Learners insert own attempts" on public.learning_attempts;
create policy "Learners insert own attempts"
on public.learning_attempts
for insert
with check (auth.uid() = learner_id);

drop policy if exists "Learners read own skill states" on public.learner_skill_states;
create policy "Learners read own skill states"
on public.learner_skill_states
for select
using (auth.uid() = learner_id);

drop policy if exists "Learners upsert own skill states" on public.learner_skill_states;
create policy "Learners upsert own skill states"
on public.learner_skill_states
for all
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

create or replace function public.get_item_calibration_stats(
  min_attempts integer default 20,
  max_items integer default 5000
)
returns table (
  item_id text,
  attempt_count integer,
  correct_count integer,
  average_response_score numeric,
  correct_rate numeric,
  average_theta_before numeric,
  average_theta_after numeric,
  average_hint_level numeric,
  last_attempt_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    attempts.item_id,
    count(*)::integer as attempt_count,
    sum(case when attempts.correct then 1 else 0 end)::integer as correct_count,
    avg(attempts.response_score)::numeric as average_response_score,
    avg(case when attempts.correct then 1.0 else 0.0 end)::numeric as correct_rate,
    avg(coalesce(attempts.theta_before, 0))::numeric as average_theta_before,
    avg(coalesce(attempts.theta_after, attempts.theta_before, 0))::numeric as average_theta_after,
    avg(attempts.hint_level)::numeric as average_hint_level,
    max(attempts.created_at) as last_attempt_at
  from public.learning_attempts attempts
  where attempts.item_id is not null
    and attempts.response_score is not null
  group by attempts.item_id
  having count(*) >= greatest(min_attempts, 1)
  order by count(*) desc, max(attempts.created_at) desc
  limit greatest(max_items, 1);
$$;

grant execute on function public.get_item_calibration_stats(integer, integer) to anon, authenticated;
