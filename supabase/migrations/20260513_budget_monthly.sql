-- Add monthly_budget column to user_budgets
-- nullable so existing rows remain valid; users can set it independently of weekly_budget

alter table user_budgets
  add column if not exists monthly_budget decimal(10,2) check (monthly_budget is null or monthly_budget > 0);
