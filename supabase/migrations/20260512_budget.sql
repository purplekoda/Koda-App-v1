-- Budget feature: user_budgets, receipts, receipt_items tables
-- Run this migration in Supabase SQL editor or via Supabase CLI

-- ── user_budgets ──────────────────────────────────────────────────────────────

create table if not exists user_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekly_budget decimal(10,2) not null check (weekly_budget > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table user_budgets enable row level security;

create policy "users can select own budget"
  on user_budgets for select
  using (auth.uid() = user_id);

create policy "users can insert own budget"
  on user_budgets for insert
  with check (auth.uid() = user_id);

create policy "users can update own budget"
  on user_budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own budget"
  on user_budgets for delete
  using (auth.uid() = user_id);

-- ── receipts ──────────────────────────────────────────────────────────────────

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  total_amount decimal(10,2) not null default 0,
  store_name text,
  entry_type text not null check (entry_type in ('photo', 'manual')) default 'manual',
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table receipts enable row level security;

create policy "users can select own receipts"
  on receipts for select
  using (auth.uid() = user_id);

create policy "users can insert own receipts"
  on receipts for insert
  with check (auth.uid() = user_id);

create policy "users can update own receipts"
  on receipts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own receipts"
  on receipts for delete
  using (auth.uid() = user_id);

-- ── receipt_items ─────────────────────────────────────────────────────────────

create table if not exists receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  item_name text not null,
  quantity decimal(10,3) not null default 1,
  unit_price decimal(10,2),
  total_price decimal(10,2) not null,
  category text,
  created_at timestamptz not null default now()
);

alter table receipt_items enable row level security;

create policy "users can select own receipt items"
  on receipt_items for select
  using (
    exists (
      select 1 from receipts r
      where r.id = receipt_items.receipt_id
        and r.user_id = auth.uid()
    )
  );

create policy "users can insert own receipt items"
  on receipt_items for insert
  with check (
    exists (
      select 1 from receipts r
      where r.id = receipt_items.receipt_id
        and r.user_id = auth.uid()
    )
  );

create policy "users can update own receipt items"
  on receipt_items for update
  using (
    exists (
      select 1 from receipts r
      where r.id = receipt_items.receipt_id
        and r.user_id = auth.uid()
    )
  );

create policy "users can delete own receipt items"
  on receipt_items for delete
  using (
    exists (
      select 1 from receipts r
      where r.id = receipt_items.receipt_id
        and r.user_id = auth.uid()
    )
  );

-- ── Recipe cost columns ───────────────────────────────────────────────────────

alter table recipes
  add column if not exists estimated_cost decimal(10,2),
  add column if not exists cost_per_serving decimal(10,2),
  add column if not exists cost_overridden boolean not null default false;

-- ── Supabase Storage bucket (run via Supabase dashboard or CLI) ───────────────
-- insert into storage.buckets (id, name, public)
-- values ('receipts', 'receipts', false)
-- on conflict (id) do nothing;
--
-- create policy "users can upload own receipts"
--   on storage.objects for insert
--   with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "users can read own receipts"
--   on storage.objects for select
--   using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "users can delete own receipts"
--   on storage.objects for delete
--   using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
