-- Chat undo actions: server-captured snapshots so a user can revert a small
-- chat write within a short window. The RPCs never trust "before" data from
-- the caller — they read the current rows inside SECURITY DEFINER and filter
-- by auth.uid().
--
-- Also adds helpers that keep chat_pending_actions one-per-kind (supersede on
-- insert) and let a user cancel a pending row without an UPDATE policy.

-- ── Table ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_undo_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entries JSONB NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 seconds'),
  used_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ
);

ALTER TABLE chat_undo_actions ENABLE ROW LEVEL SECURITY;

-- SELECT-own only. No INSERT/UPDATE/DELETE policies on purpose — every write
-- goes through a SECURITY DEFINER function below.
CREATE POLICY "Users select own undo actions"
  ON chat_undo_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_undo_actions_user
  ON chat_undo_actions(user_id, created_at);

-- ── supersede_chat_undo ───────────────────────────────────────────────────
-- Marks all of the caller's open undo rows superseded. Called when a new
-- undo is being recorded and when a pending action is confirmed.

CREATE OR REPLACE FUNCTION supersede_chat_undo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN; END IF;
  UPDATE chat_undo_actions
     SET superseded_at = now()
   WHERE user_id = caller
     AND used_at IS NULL
     AND superseded_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION supersede_chat_undo() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION supersede_chat_undo() TO authenticated;

-- ── record_chat_undo ──────────────────────────────────────────────────────
-- Takes only target row references + a label. Reads the current rows itself
-- so a forged "before" cannot be stored. Each target is one of:
--
--   { "kind":"slot",    "meal_plan_id":<uuid>, "day_of_week":<int>, "meal_type":<text> }
--   { "kind":"pantry",  "pantry_id":<uuid> }
--   { "kind":"staple",  "staple_id":<uuid> }
--   { "kind":"grocery_ids", "ids":[<uuid>, ...] }     -- post-insert attach
--
-- Rows not owned by the caller are silently dropped.

CREATE OR REPLACE FUNCTION record_chat_undo(p_targets JSONB, p_label TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
  target JSONB;
  built  JSONB := '[]'::jsonb;
  entry  JSONB;
  slot_row RECORD;
  pantry_row RECORD;
  staple_row RECORD;
  verified_ids UUID[];
  new_id UUID;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN NULL; END IF;

  -- Supersede the caller's open undo rows first so only the newest is valid.
  UPDATE chat_undo_actions
     SET superseded_at = now()
   WHERE user_id = caller
     AND used_at IS NULL
     AND superseded_at IS NULL;

  FOR target IN SELECT * FROM jsonb_array_elements(COALESCE(p_targets, '[]'::jsonb))
  LOOP
    IF target->>'kind' = 'slot' THEN
      SELECT custom_meal_name, recipe_id INTO slot_row
        FROM meal_slots
       WHERE meal_plan_id = (target->>'meal_plan_id')::uuid
         AND day_of_week  = (target->>'day_of_week')::int
         AND meal_type    =  target->>'meal_type'
         AND user_id      =  caller;
      entry := jsonb_build_object(
        'kind', 'slot',
        'ref',  jsonb_build_object(
          'meal_plan_id', target->>'meal_plan_id',
          'day_of_week',  (target->>'day_of_week')::int,
          'meal_type',    target->>'meal_type'
        ),
        'before', CASE
          WHEN slot_row IS NULL THEN NULL
          ELSE jsonb_build_object(
            'custom_meal_name', slot_row.custom_meal_name,
            'recipe_id',        slot_row.recipe_id
          )
        END
      );
      built := built || jsonb_build_array(entry);

    ELSIF target->>'kind' = 'pantry' THEN
      SELECT id, is_depleted, ingredient_name INTO pantry_row
        FROM pantry
       WHERE id = (target->>'pantry_id')::uuid
         AND user_id = caller;
      IF FOUND THEN
        entry := jsonb_build_object(
          'kind',   'pantry',
          'ref',    jsonb_build_object('pantry_id', pantry_row.id),
          'before', jsonb_build_object(
            'is_depleted',     pantry_row.is_depleted,
            'ingredient_name', pantry_row.ingredient_name
          )
        );
        built := built || jsonb_build_array(entry);
      END IF;

    ELSIF target->>'kind' = 'staple' THEN
      SELECT id, is_out_of_stock, out_of_stock_since, name INTO staple_row
        FROM pantry_staples
       WHERE id = (target->>'staple_id')::uuid
         AND user_id = caller;
      IF FOUND THEN
        entry := jsonb_build_object(
          'kind',   'staple',
          'ref',    jsonb_build_object('staple_id', staple_row.id),
          'before', jsonb_build_object(
            'is_out_of_stock',    staple_row.is_out_of_stock,
            'out_of_stock_since', staple_row.out_of_stock_since,
            'name',               staple_row.name
          )
        );
        built := built || jsonb_build_array(entry);
      END IF;

    ELSIF target->>'kind' = 'grocery_ids' THEN
      SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO verified_ids
        FROM grocery_items
       WHERE id = ANY (
               SELECT (jsonb_array_elements_text(target->'ids'))::uuid
             )
         AND user_id = caller;
      IF array_length(verified_ids, 1) > 0 THEN
        entry := jsonb_build_object(
          'kind', 'grocery_ids',
          'ids',  to_jsonb(verified_ids)
        );
        built := built || jsonb_build_array(entry);
      END IF;
    END IF;
  END LOOP;

  IF jsonb_array_length(built) = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO chat_undo_actions (user_id, entries, label)
  VALUES (caller, built, p_label)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_chat_undo(JSONB, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION record_chat_undo(JSONB, TEXT) TO authenticated;

-- ── claim_chat_undo ───────────────────────────────────────────────────────
-- Atomic one-shot claim. Returns the row if it belongs to the caller, is
-- unused, unsuperseded, and unexpired.

CREATE OR REPLACE FUNCTION claim_chat_undo(p_undo_id UUID)
RETURNS chat_undo_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
  claimed chat_undo_actions;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN NULL; END IF;

  UPDATE chat_undo_actions
     SET used_at = now()
   WHERE id = p_undo_id
     AND user_id = caller
     AND used_at IS NULL
     AND superseded_at IS NULL
     AND expires_at > now()
  RETURNING * INTO claimed;

  RETURN claimed;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_chat_undo(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION claim_chat_undo(UUID) TO authenticated;

-- ── attach_chat_undo_slot_after ───────────────────────────────────────────
-- Record the post-write "after" state of one slot on an existing undo row.
-- Takes only the undo id and the slot reference — never meal data. Reads the
-- current slot inside the function and only writes when BOTH the undo row and
-- the slot belong to auth.uid(). No-ops otherwise.

CREATE OR REPLACE FUNCTION attach_chat_undo_slot_after(
  p_undo_id UUID,
  p_meal_plan_id UUID,
  p_day_of_week INT,
  p_meal_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
  undo_owner UUID;
  slot_row RECORD;
  after_json JSONB;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN; END IF;

  SELECT user_id INTO undo_owner FROM chat_undo_actions WHERE id = p_undo_id;
  IF undo_owner IS NULL OR undo_owner <> caller THEN RETURN; END IF;

  SELECT custom_meal_name, recipe_id INTO slot_row
    FROM meal_slots
   WHERE meal_plan_id = p_meal_plan_id
     AND day_of_week  = p_day_of_week
     AND meal_type    = p_meal_type
     AND user_id      = caller;

  IF slot_row IS NULL THEN
    after_json := NULL;
  ELSE
    after_json := jsonb_build_object(
      'custom_meal_name', slot_row.custom_meal_name,
      'recipe_id',        slot_row.recipe_id
    );
  END IF;

  -- Set `after` on every matching entry (slot kind + same ref) in-place.
  UPDATE chat_undo_actions
     SET entries = (
       SELECT jsonb_agg(
         CASE
           WHEN e->>'kind' = 'slot'
            AND e->'ref'->>'meal_plan_id' = p_meal_plan_id::text
            AND (e->'ref'->>'day_of_week')::int = p_day_of_week
            AND e->'ref'->>'meal_type' = p_meal_type
           THEN jsonb_set(e, '{after}', COALESCE(after_json, 'null'::jsonb), true)
           ELSE e
         END
       )
       FROM jsonb_array_elements(entries) e
     )
   WHERE id = p_undo_id AND user_id = caller;
END;
$$;

REVOKE EXECUTE ON FUNCTION attach_chat_undo_slot_after(UUID, UUID, INT, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION attach_chat_undo_slot_after(UUID, UUID, INT, TEXT) TO authenticated;

-- ── supersede_chat_pending_actions ────────────────────────────────────────
-- Cancels any of the caller's unclaimed, unexpired pending rows of the given
-- action_type. Called server-side right before inserting a new pending row
-- so only the newest can be claimed. Modeled on claim_chat_pending_action —
-- no UPDATE policy on chat_pending_actions exists on purpose.

CREATE OR REPLACE FUNCTION supersede_chat_pending_actions(p_action_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN; END IF;
  UPDATE chat_pending_actions
     SET cancelled = true,
         used_at   = now()
   WHERE user_id   = caller
     AND action_type = p_action_type
     AND used_at IS NULL
     AND cancelled = false
     AND expires_at > now();
END;
$$;

REVOKE EXECUTE ON FUNCTION supersede_chat_pending_actions(TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION supersede_chat_pending_actions(TEXT) TO authenticated;

-- ── cancel_chat_pending_action ────────────────────────────────────────────
-- User-triggered cancel of a single pending row. SECURITY DEFINER because
-- chat_pending_actions has no UPDATE policy.

CREATE OR REPLACE FUNCTION cancel_chat_pending_action(p_pending_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID;
  affected INT;
BEGIN
  caller := auth.uid();
  IF caller IS NULL THEN RETURN false; END IF;

  UPDATE chat_pending_actions
     SET cancelled = true,
         used_at   = now()
   WHERE id = p_pending_id
     AND user_id = caller
     AND used_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION cancel_chat_pending_action(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION cancel_chat_pending_action(UUID) TO authenticated;
