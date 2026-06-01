-- SWOL initial schema.
--
-- Model (locked with Will):
--   exercises          canonical catalog. owner_id NULL = global/shared.
--                      user rows are private "stubs" until promoted to global.
--   workouts           a session (metadata).
--   exercise_logs      "the <exercise> portion of this workout" — holds the
--                      exercise_id + workout_id. One exercise per log.
--   sets               individual sets, child of exercise_log.
--   routines /         pre-gym workout templates (separate from logged data).
--   routine_exercises
--   follows / reactions   low-key social graph.
--
-- FKs live on the child pointing up, so any set reverse-joins all the way back
-- to its workout: set -> exercise_log (workout_id, exercise_id) -> workout.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------------
create type exercise_modality as enum (
    'weighted',   -- external load: barbell, dumbbell, machine
    'bodyweight', -- reps, optionally +/- assist load
    'duration',   -- timed holds: plank, etc.
    'cardio'      -- distance/time/HR focused
);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users). dob is PRIVATE (owner-only RLS + view).
-- ---------------------------------------------------------------------------
create table public.profiles (
    id           uuid primary key references auth.users (id) on delete cascade,
    display_name text not null,
    avatar_url   text,
    dob          date,
    created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- exercises (the catalog / shared vocabulary)
-- ---------------------------------------------------------------------------
create table public.exercises (
    id              uuid primary key default gen_random_uuid(),
    -- NULL owner = global/seeded/shared. Non-null = a user's private exercise.
    owner_id        uuid references auth.users (id) on delete cascade,
    name            text not null,
    -- collapses "Bench Press" / "bench press" / "Benchpress" -> "benchpress"
    normalized_name text generated always as
        (regexp_replace(lower(name), '[^a-z0-9]', '', 'g')) stored,
    modality        exercise_modality not null default 'weighted',
    muscle_group    text,
    equipment       text,
    -- weight/duration authoring guardrails (Will's "5-15lb x 2.5" case)
    unit            text not null default 'lb',  -- lb | kg | sec | m | etc.
    increment       numeric(6, 2),               -- e.g. 2.50
    min_value       numeric(7, 2),
    max_value       numeric(7, 2),
    -- inline-created exercises start as stubs: logged fast, enrich later in
    -- the CRUD panel. Promotion to global is a deliberate admin action.
    is_stub         boolean not null default false,
    created_at      timestamptz not null default now()
);

-- Global names are unique; each user's own names are unique to them. The two
-- partial indexes keep a user's "Bench Press" from colliding with the global
-- one (resolution to the global row is handled in the app data layer).
create unique index exercises_global_norm_uniq
    on public.exercises (normalized_name)
    where owner_id is null;

create unique index exercises_owner_norm_uniq
    on public.exercises (owner_id, normalized_name)
    where owner_id is not null;

create index exercises_owner_idx on public.exercises (owner_id);

alter table public.exercises enable row level security;

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table public.workouts (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users (id) on delete cascade,
    title        text,
    notes        text,
    routine_id   uuid,  -- set if started from a template (FK added below)
    performed_at timestamptz not null default now(),
    created_at   timestamptz not null default now()
);

create index workouts_user_perf_idx
    on public.workouts (user_id, performed_at desc);

alter table public.workouts enable row level security;

-- ---------------------------------------------------------------------------
-- exercise_logs (one exercise within a workout)
-- ---------------------------------------------------------------------------
create table public.exercise_logs (
    id          uuid primary key default gen_random_uuid(),
    workout_id  uuid not null references public.workouts (id) on delete cascade,
    exercise_id uuid not null references public.exercises (id) on delete restrict,
    position    int  not null default 0,
    notes       text
);

create index exercise_logs_workout_idx
    on public.exercise_logs (workout_id, position);
create index exercise_logs_exercise_idx
    on public.exercise_logs (exercise_id);

alter table public.exercise_logs enable row level security;

-- ---------------------------------------------------------------------------
-- sets (child of exercise_log)
-- ---------------------------------------------------------------------------
create table public.sets (
    id              uuid primary key default gen_random_uuid(),
    exercise_log_id uuid not null
        references public.exercise_logs (id) on delete cascade,
    position        int  not null default 0,
    reps            int,
    weight          numeric(7, 2),
    duration_sec    int,
    distance_m      numeric(8, 2),
    rpe             numeric(3, 1),    -- rate of perceived exertion 0-10
    hr_start        int,             -- bpm at the start of the set
    hr_end          int,             -- bpm at the end of the set
    hr_avg          int,
    is_warmup       boolean not null default false,
    done            boolean not null default false
);

create index sets_log_idx on public.sets (exercise_log_id, position);

alter table public.sets enable row level security;

-- ---------------------------------------------------------------------------
-- routines (pre-gym templates) + routine_exercises
-- ---------------------------------------------------------------------------
create table public.routines (
    id         uuid primary key default gen_random_uuid(),
    owner_id   uuid not null references auth.users (id) on delete cascade,
    name       text not null,
    notes      text,
    created_at timestamptz not null default now()
);

alter table public.routines enable row level security;

-- now that routines exists, point workouts.routine_id at it (nullable, keep
-- the workout's history even if the template is later deleted)
alter table public.workouts
    add constraint workouts_routine_fk
    foreign key (routine_id) references public.routines (id) on delete set null;

create table public.routine_exercises (
    id              uuid primary key default gen_random_uuid(),
    routine_id      uuid not null references public.routines (id) on delete cascade,
    exercise_id     uuid not null references public.exercises (id) on delete restrict,
    position        int  not null default 0,
    target_sets     int,
    target_reps_low int,
    target_reps_high int,
    target_weight   numeric(7, 2)
);

create index routine_exercises_routine_idx
    on public.routine_exercises (routine_id, position);

alter table public.routine_exercises enable row level security;

-- ---------------------------------------------------------------------------
-- social: follows + reactions
-- ---------------------------------------------------------------------------
create table public.follows (
    follower_id uuid not null references auth.users (id) on delete cascade,
    followee_id uuid not null references auth.users (id) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (follower_id, followee_id),
    check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create table public.reactions (
    id         uuid primary key default gen_random_uuid(),
    workout_id uuid not null references public.workouts (id) on delete cascade,
    user_id    uuid not null references auth.users (id) on delete cascade,
    emoji      text not null default '💪',
    created_at timestamptz not null default now(),
    unique (workout_id, user_id, emoji)
);

alter table public.reactions enable row level security;

-- ===========================================================================
-- helper: is the current user allowed to see this workout?
-- (owner, or a follower of the owner). SECURITY DEFINER + stable so RLS
-- policies can call it without recursive policy evaluation.
-- ===========================================================================
create or replace function public.can_see_workout(wk uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.workouts w
        where w.id = wk
          and (
              w.user_id = auth.uid()
              or exists (
                  select 1 from public.follows f
                  where f.followee_id = w.user_id
                    and f.follower_id = auth.uid()
              )
          )
    );
$$;

-- ===========================================================================
-- RLS policies
-- ===========================================================================

-- profiles: owner-only on the base table (protects dob)
create policy profiles_select_own on public.profiles
    for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
    for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
    for update using (auth.uid() = id);

-- public projection of profiles WITHOUT dob, readable by any authed user
create view public.public_profiles
with (security_invoker = true) as
    select id, display_name, avatar_url, created_at
    from public.profiles;

-- exercises: see globals + your own; only mutate your own
create policy exercises_select on public.exercises
    for select using (owner_id is null or owner_id = auth.uid());
create policy exercises_insert_own on public.exercises
    for insert with check (owner_id = auth.uid());
create policy exercises_update_own on public.exercises
    for update using (owner_id = auth.uid());
create policy exercises_delete_own on public.exercises
    for delete using (owner_id = auth.uid());

-- workouts: owner full control; followers can read
create policy workouts_owner_all on public.workouts
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy workouts_followers_select on public.workouts
    for select using (
        exists (
            select 1 from public.follows f
            where f.followee_id = workouts.user_id
              and f.follower_id = auth.uid()
        )
    );

-- exercise_logs: visibility + ownership follow the parent workout
create policy exercise_logs_owner_all on public.exercise_logs
    for all using (
        exists (
            select 1 from public.workouts w
            where w.id = exercise_logs.workout_id and w.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.workouts w
            where w.id = exercise_logs.workout_id and w.user_id = auth.uid()
        )
    );
create policy exercise_logs_followers_select on public.exercise_logs
    for select using (public.can_see_workout(workout_id));

-- sets: follow the parent exercise_log -> workout
create policy sets_owner_all on public.sets
    for all using (
        exists (
            select 1
            from public.exercise_logs el
            join public.workouts w on w.id = el.workout_id
            where el.id = sets.exercise_log_id and w.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1
            from public.exercise_logs el
            join public.workouts w on w.id = el.workout_id
            where el.id = sets.exercise_log_id and w.user_id = auth.uid()
        )
    );
create policy sets_followers_select on public.sets
    for select using (
        exists (
            select 1 from public.exercise_logs el
            where el.id = sets.exercise_log_id
              and public.can_see_workout(el.workout_id)
        )
    );

-- routines + routine_exercises: private to owner
create policy routines_owner_all on public.routines
    for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy routine_exercises_owner_all on public.routine_exercises
    for all using (
        exists (
            select 1 from public.routines r
            where r.id = routine_exercises.routine_id and r.owner_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.routines r
            where r.id = routine_exercises.routine_id and r.owner_id = auth.uid()
        )
    );

-- follows
create policy follows_select_involved on public.follows
    for select using (auth.uid() = follower_id or auth.uid() = followee_id);
create policy follows_insert_self on public.follows
    for insert with check (auth.uid() = follower_id);
create policy follows_delete_self on public.follows
    for delete using (auth.uid() = follower_id);

-- reactions: write your own; read any reaction on a workout you can see
create policy reactions_insert_self on public.reactions
    for insert with check (auth.uid() = user_id);
create policy reactions_delete_self on public.reactions
    for delete using (auth.uid() = user_id);
create policy reactions_select_visible on public.reactions
    for select using (public.can_see_workout(workout_id));

-- ===========================================================================
-- auto-create a profile row on signup
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, display_name, avatar_url)
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name',
            split_part(new.email, '@', 1)
        ),
        new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
