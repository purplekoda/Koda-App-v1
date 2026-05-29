-- Add store_assignment to grocery_items
-- Stores the store ID (e.g. 'walmart', 'target') or null for unassigned items.

alter table grocery_items
  add column if not exists store_assignment text;
