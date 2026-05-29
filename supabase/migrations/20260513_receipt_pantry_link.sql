-- Add receipt-to-pantry link columns
-- Allows classifying receipt items via Gemini and adding them to pantry/pantry_staples.

-- receipts: store Gemini classification result for all items on a receipt
alter table receipts
  add column if not exists classified_items jsonb null;

-- receipt_items: track when an individual item was added to the pantry
alter table receipt_items
  add column if not exists added_to_pantry_at timestamptz null;

-- pantry_staples: track when a staple was last restocked and from which receipt
alter table pantry_staples
  add column if not exists last_restocked_at timestamptz null,
  add column if not exists source_receipt_id uuid null
    references receipts(id) on delete set null;

-- pantry: add receipt-sourced expiry suggestion (distinct from expiry_date used by kitchen scans)
-- and link back to the originating receipt
alter table pantry
  add column if not exists expires_at date null,
  add column if not exists source_receipt_id uuid null
    references receipts(id) on delete set null;

-- Indexes for FK lookups
create index if not exists idx_pantry_source_receipt_id
  on pantry(source_receipt_id);

create index if not exists idx_pantry_staples_source_receipt_id
  on pantry_staples(source_receipt_id);
