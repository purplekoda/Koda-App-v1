-- Mark the earliest-created household member per user as is_primary
alter table household_members
  add column if not exists is_primary boolean not null default false;

-- Backfill: set is_primary = true for the first member per user
update household_members hm
set is_primary = true
where hm.created_at = (
  select min(created_at) from household_members h2 where h2.user_id = hm.user_id
);
