-- Macros feature: macro_logs table + macro target columns on household_members
-- Run this migration in Supabase SQL editor or via Supabase CLI

-- ── macro_logs ────────────────────────────────────────────────────────────────

create table if not exists macro_logs (
  id uuid primary key default gen_random_uuid(),
  household_member_id uuid not null references household_members(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null,
  serving_description text,
  calories integer not null default 0,
  protein_grams decimal(6,1) not null default 0,
  carbohydrate_grams decimal(6,1) not null default 0,
  fat_grams decimal(6,1) not null default 0,
  source text not null check (source in ('photo', 'manual', 'meal_plan')) default 'manual',
  photo_path text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  notes text,
  confirmed boolean not null default true,
  created_at timestamptz not null default now()
);

alter table macro_logs enable row level security;

-- Members can only see their own logs; owner (user_id) can see all in household
create policy "users can select own macro logs"
  on macro_logs for select
  using (auth.uid() = user_id);

create policy "users can insert own macro logs"
  on macro_logs for insert
  with check (auth.uid() = user_id);

create policy "users can update own macro logs"
  on macro_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own macro logs"
  on macro_logs for delete
  using (auth.uid() = user_id);

-- ── household_members: macro target columns ───────────────────────────────────

alter table household_members
  add column if not exists track_macros boolean not null default false,
  add column if not exists daily_calorie_target integer,
  add column if not exists daily_protein_target integer,
  add column if not exists daily_carb_target integer,
  add column if not exists daily_fat_target integer,
  add column if not exists macro_meal_distribution jsonb;

-- ── Supabase Storage bucket (run via Supabase dashboard or CLI) ───────────────
-- insert into storage.buckets (id, name, public)
-- values ('macro-photos', 'macro-photos', false)
-- on conflict (id) do nothing;
--
-- create policy "users can upload own macro photos"
--   on storage.objects for insert
--   with check (bucket_id = 'macro-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "users can read own macro photos"
--   on storage.objects for select
--   using (bucket_id = 'macro-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "users can delete own macro photos"
--   on storage.objects for delete
--   using (bucket_id = 'macro-photos' and auth.uid()::text = (storage.foldername(name))[1]);
